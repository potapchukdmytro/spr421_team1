using Microsoft.AspNetCore.Mvc;
using web_chat.BLL.Services;

namespace web_chat.Extensions
{
    public static class ControllerBaseExtensions
    {
        public static IActionResult ToActionResult(this ControllerBase controller, ServiceResponse response)
        {
            return controller.StatusCode((int)response.StatusCode, response);
        }
    }
}
