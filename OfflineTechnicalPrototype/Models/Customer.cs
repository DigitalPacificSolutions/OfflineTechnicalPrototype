using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace OfflineTechnicalPrototype.Models
{
    public class Customer
    {
        public int CustomerId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public SimpleDate DateOfBirth { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class SimpleDate
    {
        public int Month { get; set; }
        public int Day { get; set; }
        public int Year { get; set; }
    }
}