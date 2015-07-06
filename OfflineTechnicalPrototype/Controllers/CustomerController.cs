using Newtonsoft.Json;
using OfflineTechnicalPrototype.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Helpers;
using System.Web.Mvc;

namespace OfflineTechnicalPrototype.Controllers
{
    public class CustomerController : Controller
    {
        //
        // GET: /Customer/

        public ActionResult Index()
        {
            //CustomerStore.Customers.Add(new Customer()
            //{
            //    FirstName = "John",
            //    LastName = "jones",
            //    Phone = "55555555",
            //    Email = "johnjones@mail.com",
            //    DateOfBirth = new DateOfBirth()
            //    {
            //        Month=12,
            //        Day=31,
            //        Year=2000
            //    }
            //});
            //return Json(CustomerStore.Customers, JsonRequestBehavior.AllowGet);
            
            List<Customer> customers = new List<Customer>();

            using(var db = new CustomerContext())
            {
                //var customer = new Customer()
                //{
                //    FirstName = "Sam",
                //    LastName = "Wilson",
                //    Phone = "55555555",
                //    Email = "unclesam@mail.com",
                //    DateOfBirth = new DateOfBirth()
                //    {
                //        Month = 12,
                //        Day = 31,
                //        Year = 2000
                //    }
                //};
                //db.Customers.Add(customer);
                //db.SaveChanges();

                var r = from c in db.Customers
                        orderby c.LastName
                        select c;
                foreach(var c in r)
                    customers.Add(c);
                
            }
            return Json(customers,JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public ActionResult Merge()
        {
            string json;
            Customer data;
            try
            {
                using (var reader = new StreamReader(Request.InputStream))
                {
                    json = reader.ReadToEnd();
                }
                data = JsonConvert.DeserializeObject<Customer>(json);
            }
            catch
            {
                return new HttpStatusCodeResult(422);
            }
            data.FirstName = "BAZINGA!";
            return Json(data);
        }

    }
}
