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
            List<Person> customers;
            ContentResult result = new ContentResult();
            result.ContentEncoding = Encoding.UTF8;
            result.ContentType = "application/json";

            using (var db = new AussieDiversEntities())
            {
                customers = (from p in db.People
                             orderby p.PersonLastName
                             select p).ToList();
                result.Content = JsonConvert.SerializeObject(customers, new JsonSerializerSettings {
                    //NullValueHandling = NullValueHandling.Ignore
                });
            }
            
            return result;
        }

        [HttpPost]
        public ActionResult Save()
        {
            string json;
            Person person;

            try
            {
                using (var reader = new StreamReader(Request.InputStream))
                {
                    json = reader.ReadToEnd();
                }
                person = JsonConvert.DeserializeObject<Person>(json);
            }
            catch
            {
                return new HttpStatusCodeResult(422);
            }

            using (var db = new AussieDiversEntities())
            {
                var obj = db.People.FirstOrDefault(x => x.PersonID == person.PersonID);
                if (obj != null)
                {
                    obj.PersonFirstName = person.PersonFirstName;
                    obj.PersonLastName = person.PersonLastName;
                    obj.PersonEmail = person.PersonEmail;
                    obj.PersonDOB = person.PersonDOB;
                    obj.PersonStreetAddress1 = person.PersonStreetAddress1;
                    obj.PersonStateProvinceTerritory = person.PersonStateProvinceTerritory;
                    obj.PersonCity = person.PersonCity;
                    obj.PersonCountry = person.PersonCountry;
                    obj.PersonPostalCode = person.PersonPostalCode;
                }
                else
                {
                    db.People.Add(person);
                }
                
                try
                {
                    db.SaveChanges();
                }
                catch
                {
                    return new HttpStatusCodeResult(500);
                }
            }

            return new HttpStatusCodeResult(200);
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
