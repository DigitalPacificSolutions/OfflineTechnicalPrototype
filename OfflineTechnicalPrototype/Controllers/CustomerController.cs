using Newtonsoft.Json;
using System.Text;
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
            List<Customer> customers = new List<Customer>();

            using(var db = new CustomerContext())
            {
                //var customer = new Customer()
                //{
                //    FirstName = "Sam",
                //    LastName = "Wilson",
                //    Phone = "55555555",
                //    Email = "unclesam@mail.com",
                //    DateOfBirth = new SimpleDate()
                //    {
                //        Month = 12,
                //        Day = 31,
                //        Year = 2000
                //    },
                //    UpdatedAt = DateTime.Now
                //};
                //db.Customers.Add(customer);
                //db.SaveChanges();

                var r = from c in db.Customers
                        orderby c.LastName
                        select c;
                foreach(var c in r)
                    customers.Add(c);
                
            }
            ContentResult result = new ContentResult();
            result.Content = JsonConvert.SerializeObject(customers);
            result.ContentEncoding = Encoding.UTF8;
            result.ContentType = "application/json";
            return result;
        }

        [HttpPost]
        public ActionResult Merge()
        {
            string json;
            List<Customer> data, mergeConflicts = new List<Customer>();
            try
            {
                using (var reader = new StreamReader(Request.InputStream))
                {
                    json = reader.ReadToEnd();
                }
                data = JsonConvert.DeserializeObject<List<Customer>>(json);
            }
            catch
            {
                return new HttpStatusCodeResult(422);
            }

            ContentResult result = new ContentResult();
            result.ContentEncoding = Encoding.UTF8;
            result.ContentType = "application/json";

            data.ForEach((remoteCustomer) =>
            {
                using (var db = new CustomerContext())
                {
                    var custList = 
                        from c in db.Customers
                        where c.CustomerId == remoteCustomer.CustomerId
                        select c;
                    Customer localCustomer = null;
                    if (custList.Count() > 0)
                        localCustomer = custList.First();

                    if (localCustomer == null)
                    {
                        remoteCustomer.UpdatedAt = DateTime.Now;
                        db.Customers.Add(remoteCustomer);
                    }
                    else
                    {
                        if(Request.QueryString["Overwrite"] != null ||
                           localCustomer.UpdatedAt == remoteCustomer.UpdatedAt)
                        {
                            db.Customers.Remove(localCustomer);
                            remoteCustomer.UpdatedAt = DateTime.Now;
                            db.Customers.Add(remoteCustomer);
                        }
                        else
                        {
                            mergeConflicts.Add(remoteCustomer);
                        }
                    }

                }
            });
            

            if(mergeConflicts.Count > 0)
                result.Content = JsonConvert.SerializeObject(new {Conflicts = mergeConflicts});
            else
                result.Content = JsonConvert.SerializeObject(new { });
            
            return result;
        }

    }
}
