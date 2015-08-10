
"use strict";

(function () {

    var customers, customerForm, changedCustomers = [], showAlert = false;

    function Initialize()
    {
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

        request.onerror = function() {
            alert('Unable to sync, you may need to check your connection and try again');
        };

        request.open("POST", "/Customer/Merge"+(overwrite?'?Overwrite=1':''), true);
        request.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        request.send(JSON.stringify(changedCustomers));
    }
    document.getElementById('SyncBtn').addEventListener('click', Sync);

    function InitializeCustomers()
    {
        var html = '';
        customers.forEach(function (c) {
            html += '<option value="' + c.CustomerId + '">' + c.LastName + ', ' + c.FirstName + '</option>';
        });
        var customerDropDown = document.getElementById('CustomerId');
        customerDropDown.innerHTML = html;
        customerDropDown.addEventListener('change', UpdateForm);

        customerForm = new CustomerForm(customers[0]);
        customerForm.Populate();
    }

    function LoadCustomers()
    {
        var request = new XMLHttpRequest();

        request.onload = function () {
            customers = JSON.parse(this.response).map(function (c) {
                return new Customer(c.CustomerId, c.FirstName, c.LastName,
                    c.Phone, c.Email, c.DateOfBirth, c.UpdatedAt);
            });
            changedCustomers = [];

            // Save to LocalStorage
            localStorage.setItem('customers', JSON.stringify(customers));
            localStorage.setItem('changedCustomers', JSON.stringify(changedCustomers));

            InitializeCustomers();
            
            if (showAlert)
                alert('Sync\'d!');
            showAlert = true;
        };

        request.onerror = function () {
            customers = JSON.parse(localStorage.getItem('customers'));
            changedCustomers = JSON.parse(localStorage.getItem('changedCustomers'));

            InitializeCustomers();

            console.log("an error has occured", customers, changedCustomers);
        };

        request.open("GET", "/Customer", true);
        request.send();
    }

    function AddCustomer()
    {
        var max = Math.max.apply(null, customers.map(function (c) { return c.CustomerId; }));
        if (max === Infinity || max === -Infinity) max = 0;

        document.getElementById('CustomerId').innerHTML += "<option value=\""+(max+1)+"\"></option>";

        var customer = new Customer(max + 1);
        customerForm.Populate(customer);
    }
    document.getElementById('AddCustomerBtn').addEventListener('click', AddCustomer);

    function UpdateForm(evt)
    {
        var selectedCustomer = customers.filter(function (c) {
            return c.CustomerId.toString() === evt.target.value.toString();
        })[0];
        customerForm.Populate(selectedCustomer);
    }

    function InitDates()
    {
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

    function SaveCustomer()
    {
        var newCustomer = customerForm.GetValue();
        var errors = newCustomer.Validate();
        if (errors.length > 0) {
            alert(errors[0]);
            return false;
        }

        ReplaceOrAdd(customers, customers.filter(function (c) { return c.CustomerId == newCustomer.CustomerId; })[0], newCustomer);
        ReplaceOrAdd(changedCustomers, changedCustomers.filter(function (c) { return c.CustomerId == newCustomer.CustomerId; })[0], newCustomer);
        customerForm.Populate(newCustomer);

        // Save to LocalStorage
        localStorage.setItem('customers', JSON.stringify(customers));
        localStorage.setItem('changedCustomers', JSON.stringify(changedCustomers));

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
                       Phone, Email, DateOfBirth, UpdatedAt)
    {
        this.CustomerId = CustomerId;
        this.FirstName = FirstName || '';
        this.LastName = LastName || '';
        this.Phone = Phone || '';
        this.Email = Email || '';
        this.DateOfBirth = DateOfBirth || {};
        this.UpdatedAt = UpdatedAt || (new Date).toJSON();
    }
    Customer.prototype = {
        Validate: function ()
        {
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

    function CustomerForm(model)
    {
        this.model = model || {};
    }
    CustomerForm.prototype = {
        Populate: function (model)
        {
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

            // Update dropdown
            // Unfortunately, HTMLCollections don't inherit from Array :(
            Array.prototype.filter.call(customerDropDown.children, (function (c) {
                return c.nodeName.toUpperCase() === 'OPTION' &&
                    c.value && c.value.toString() === this.model.CustomerId.toString();
            }).bind(this))[0].innerHTML = this.model.LastName + ", " + this.model.FirstName;
        },
        GetValue: function ()
        {
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

            return newCustomer;
        }
    };
})();