
"use strict";

(function () {

    var customers, customerForm;

    function Initialize() {
        InitDates();

        var request = new XMLHttpRequest();

        request.onload = function () {
            customers = JSON.parse(this.response).map(function (c) {
                return new Customer(c.CustomerId, c.FirstName, c.LastName,
                    c.Phone, c.Email, c.DateOfBirth);
            });

            var html = '';
            customers.forEach(function (c) {
                html += '<option value="' + c.CustomerId + '">' + c.LastName + ', ' + c.FirstName + '</option>';
            });
            var customerDropDown = document.getElementById('CustomerId');
            customerDropDown.innerHTML += html;
            customerDropDown.addEventListener('change', UpdateForm);

            customerForm = new CustomerForm(customers[0]);
            customerForm.Populate();
        };

        request.open("GET", "/Customer", true);
        request.send();

        var r = new XMLHttpRequest();
        r.onload = function () {
            console.log("response", r.response);
        };
        r.open("POST", "/Customer/Merge", true);
        r.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        r.send(
            JSON.stringify({
            CustomerId: 1,
            FirstName: "Charles",
            LastName: "Swanson",
            Phone: "9999999999",
            Email: "charles@mail.com",
            DateOfBirth: {
                Month: 11,
                Day: 30,
                Year: 1965
            }
        }));
    }

    window.addEventListener('DOMContentLoaded', Initialize);

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
            return;
        }
        var index = customers.indexOf(customers.filter(function (c) { return c.CustomerId == newCustomer.CustomerId; })[0]);
        customers[index] = newCustomer;
        customerForm.Populate(newCustomer);
    }

    window.document.getElementById('SaveBtn').addEventListener('click', SaveCustomer);

    function Customer(CustomerId, FirstName, LastName,
                       Phone, Email, DateOfBirth) {
        this.CustomerId = CustomerId;
        this.FirstName = FirstName;
        this.LastName = LastName;
        this.Phone = Phone;
        this.Email = Email;
        this.DateOfBirth = DateOfBirth;
    }
    Customer.prototype = {
        Validate: function () {
            var missingFields = [], errors = [];
            for (var prop in this) {
                if (this.hasOwnProperty(prop) && typeof this[prop] === 'string' && this[prop].trim().length == 0)
                    missingFields.push(prop);
            }
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

            document.getElementById('DOBMonth').value = this.model.DateOfBirth.Month.toString();
            document.getElementById('DOBDay').value = this.model.DateOfBirth.Day.toString();
            document.getElementById('DOBYear').value = this.model.DateOfBirth.Year.toString();

            var customerDropDown = document.getElementById('CustomerId');
            var selectedCustomer = customers.filter(function (c) {
                return c.CustomerId.toString() === customerDropDown.value;
            })[0];
            // Update dropdown
            // Unfortunately, HTMLCollections don't inherit from Array :(

            Array.prototype.filter.call(customerDropDown.children, function (c) {
                return c.nodeName.toUpperCase() === 'OPTION' &&
                    c.value && c.value.toString() === selectedCustomer.CustomerId.toString();
            })[0].innerHTML = selectedCustomer.LastName + ", " + selectedCustomer.FirstName;
        },
        GetValue: function () {
            var cusomtersDropDown = document.getElementById('CustomerId');
            var selectedCustomer =
                customers.filter(function (c) {
                    return c.CustomerId.toString() === cusomtersDropDown.value;
                })[0];

            var newCustomer = new Customer(selectedCustomer.CustomerId,
                document.getElementById('FirstName').value,
                document.getElementById('LastName').value,
                document.getElementById('Phone').value,
                document.getElementById('Email').value,
                {
                    Month: parseInt(document.getElementById('DOBMonth').value),
                    Day: parseInt(document.getElementById('DOBDay').value),
                    Year: parseInt(document.getElementById('DOBYear').value)
                });
            return newCustomer;
        }
    };
})();