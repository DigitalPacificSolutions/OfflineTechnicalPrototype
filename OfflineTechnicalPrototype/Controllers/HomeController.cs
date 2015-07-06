using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace OfflineTechnicalPrototype.Controllers
{
    public class HomeController : Controller
    {
        // GET: /
        // GET: /Home/

        public ActionResult Index()
        {
            return new FilePathResult(@"Content\Index.html", "text/html");
        }

    }
}
