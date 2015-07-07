
"use strict";

(function () {

    var customers, customerForm, changedCustomers = [];

    function Initialize() {
        InitDates();
        LoadCustomers();
    }

    window.addEventListener('DOMContentLoaded', Initialize);

    
    function Sync(overwrite)
    {
        if (!SaveCustomer())
            return;
        overwrite = (overwrite === true);
        var request = new XMLHttpRequest();
        request.onload = function () {
            console.log("response", request.response);
            var response = JSON.parse(request.response);
            if (response.Conflicts && !overwrite) {
                var conflicts = response.Conflicts.map(function (c) { return c.FirstName + ' ' + c.LastName + ' (Customer Id: ' + c.CustomerId + ')\n' });
                var confirmed = confirm('The data has been changed since your last sync for the following customers:\n\n' + conflicts.join('') +
                    '\nDo you want to overwrite the data? (Cancel will loose your recent changes)');
                if (confirmed) {
                    Sync(true);
                } else {
                    LoadCustomers();
                }

            } else {
                LoadCustomers();
            }
        };

        request.open("POST", "/Customer/Merge"+(overwrite?'?Overwrite=1':''), true);
        request.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        request.send(JSON.stringify(changedCustomers));
        //request.send(
        //    JSON.stringify([{
        //        customerid: 1,
        //        firstname: "Charles",
        //        lastname: "Swanson",
        //        phone: "9999999999",
        //        email: "charles@mail.com",
        //        dateofbirth: {
        //            month: 11,
        //            day: 30,
        //            year: 1965
        //        },
        //        UpdatedAt: "2015-07-07T17:09:42.466Z"
        //    }]));
    }
    document.getElementById('SyncBtn').addEventListener('click', Sync);

    function LoadCustomers()
    {
        var request = new XMLHttpRequest();

        request.onload = function () {
            customers = JSON.parse(this.response).map(function (c) {
                return new Customer(c.CustomerId, c.FirstName, c.LastName,
                    c.Phone, c.Email, c.DateOfBirth, c.UpdatedAt);
            });
            changedCustomers = [];

            var html = '';
            customers.forEach(function (c) {
                html += '<option value="' + c.CustomerId + '">' + c.LastName + ', ' + c.FirstName + '</option>';
            });
            var customerDropDown = document.getElementById('CustomerId');
            customerDropDown.innerHTML = html;
            customerDropDown.addEventListener('change', UpdateForm);

            customerForm = new CustomerForm(customers[0]);
            customerForm.Populate();
        };

        request.onerror = function () {
            console.log("an error has occured");
        };

        request.open("GET", "/Customer", true);
        request.send();
    }

    function AddCustomer()
    {
        var max = Math.max.apply(null, customers.map(function (c) { return c.CustomerId; }));

        document.getElementById('CustomerId').innerHTML += "<option value=\""+(max+1)+"\"></option>";

        var customer = new Customer(max + 1);
        customerForm.Populate(customer);
        //customers.push(customer);
    }
    document.getElementById('AddCustomerBtn').addEventListener('click', AddCustomer);

    function UpdateForm(evt) {
        console.log("Id is now", evt.target.value);
        var selectedCustomer = customers.filter(function (c) {
            return c.CustomerId.toString() === evt.target.value.toString();
        })[0];
        customerForm.Populate(selectedCustomer);
    }

    function InitDates() {
        var i, html = '';
        for (i = 1; i < 13; i++)
            html += "<option value=\"" + i + "\">" + i + "</option>";
        document.getElementById("DOBMonth").innerHTML += html;

        html = '';
        for (i = 1; i < 32; i++)
            html += "<option value=\"" + i + "\">" + i + "</option>";
        document.getElementById("DOBDay").innerHTML += html;

        html = '';
        for (i = 1940; i < 2015; i++)
            html += "<option value=\"" + i + "\">" + i + "</option>";
        document.getElementById("DOBYear").innerHTML += html;
    }

    function SaveCustomer() {
        var newCustomer = customerForm.GetValue();
        var errors = newCustomer.Validate();
        if (errors.length > 0) {
            alert(errors[0]);
            return false;
        }

        ReplaceOrAdd(customers, customers.filter(function (c) { return c.CustomerId == newCustomer.CustomerId; })[0], newCustomer);
        ReplaceOrAdd(changedCustomers, changedCustomers.filter(function (c) { return c.CustomerId == newCustomer.CustomerId; })[0], newCustomer);

        return true;
    }

    function ReplaceOrAdd(array, replace, add)
    {
        var index = array.indexOf(replace);
        if(index === -1)
        {
            array.push(add);
        }
        else
        {
            array[index] = add;
        }
    }

    window.document.getElementById('SaveBtn').addEventListener('click', SaveCustomer);

    function Customer(CustomerId, FirstName, LastName,
                       Phone, Email, DateOfBirth, UpdatedAt) {
        this.CustomerId = CustomerId;
        this.FirstName = FirstName || '';
        this.LastName = LastName || '';
        this.Phone = Phone || '';
        this.Email = Email || '';
        this.DateOfBirth = DateOfBirth || {};
        this.UpdatedAt = UpdatedAt || (new Date).toJSON();
    }
    Customer.prototype = {
        Validate: function () {
            var missingFields = [], errors = [];
            for (var prop in this) {
                if (this.hasOwnProperty(prop) && typeof this[prop] === 'string' &&
                    this[prop].trim().length == 0 && prop !== 'UpdatedAt')
                    missingFields.push(prop);
            }
            if (!this.DateOfBirth.Month) missingFields.push('Date Of Birth Month');
            if (!this.DateOfBirth.Day) missingFields.push('Date Of Birth Day');
            if (!this.DateOfBirth.Year) missingFields.push('Date Of Birth Year');
            if (missingFields.length > 0)
                errors.push('Please fill out the following fields: ' + missingFields.join(', '));
            return errors;
        }
    };

    function CustomerForm(model) {
        this.model = model || {};
    }
    CustomerForm.prototype = {
        Populate: function (model) {
            this.model = model || this.model;
            for (var prop in this.model) {
                if (this.model.hasOwnProperty(prop) && typeof this.model[prop] === 'string')
                    document.getElementById(prop).value = this.model[prop];
            }

            document.getElementById('DOBMonth').value = this.model.DateOfBirth.Month?this.model.DateOfBirth.Month.toString():'';
            document.getElementById('DOBDay').value = this.model.DateOfBirth.Day?this.model.DateOfBirth.Day.toString():'';
            document.getElementById('DOBYear').value = this.model.DateOfBirth.Year?this.model.DateOfBirth.Year.toString():'';

            var customerDropDown = document.getElementById('CustomerId');
            customerDropDown.value = this.model.CustomerId;

            //var selectedCustomer = customers.filter(function (c) {
            //    return c.CustomerId.toString() === customerDropDown.value;
            //})[0];
            // Update dropdown
            // Unfortunately, HTMLCollections don't inherit from Array :(

            Array.prototype.filter.call(customerDropDown.children, (function (c) {
                return c.nodeName.toUpperCase() === 'OPTION' &&
                    c.value && c.value.toString() === this.model.CustomerId.toString();
            }).bind(this))[0].innerHTML = this.model.LastName + ", " + this.model.FirstName;
        },
        GetValue: function () {
            //var customersDropDown = ;
            //var selectedCustomer =
            //    customers.filter(function (c) {
            //        return c.CustomerId.toString() === customersDropDown.value;
            //    })[0];

            var newCustomer = new Customer(document.getElementById('CustomerId').value,
                document.getElementById('FirstName').value,
                document.getElementById('LastName').value,
                document.getElementById('Phone').value,
                document.getElementById('Email').value,
                {
                    Month: parseInt(document.getElementById('DOBMonth').value),
                    Day: parseInt(document.getElementById('DOBDay').value),
                    Year: parseInt(document.getElementById('DOBYear').value)
                },
                document.getElementById('UpdatedAt').value);
            console.log('new customer', newCustomer);
            return newCustomer;
        }
    };
})();