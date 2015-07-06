using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;

namespace OfflineTechnicalPrototype.Models
{
    public class CustomerContext : DbContext
    {
        public DbSet<Customer> Customers { get; set; }

        public CustomerContext() : base("name=CustomerCompactDatabase")
        {

        }
    }
}