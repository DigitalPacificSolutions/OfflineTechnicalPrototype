using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;

namespace OfflineTechnicalPrototype.Models
{
    public class CustomerContext : IDisposable //: DbContext
    {
        //public DbSet<Customer> Customers { get; set; }
        public List<Customer> Customers
        {
            get { return MemoryCustomerStore.Customers; }
            set { }
        }

        public CustomerContext()// : base("name=CustomerCompactDatabase")
        {
            
        }

        public void Dispose()
        {
            
        }
    }

    class MemoryCustomerStore
    {
        private static List<Customer> _Customers;
        public static List<Customer> Customers {
            get
            {
                if (_Customers == null)
                {
                    _Customers = new List<Customer>()
                    {
                        new Customer()
                        {
                            CustomerId = 1,
                            FirstName = "Joe",
                            LastName = "Thompson",
                            Email = "joe@mail.com",
                            Phone = "123456789",
                            DateOfBirth = new SimpleDate()
                            {
                                Day = 20, Month = 5, Year = 1980
                            },
                            UpdatedAt = new DateTime(2015, 5, 25)
                        }
                    };
                }

                return _Customers;
            }
            protected set
            {

            }
        }
    }
}