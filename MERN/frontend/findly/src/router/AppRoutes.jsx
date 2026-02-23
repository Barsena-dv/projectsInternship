import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Login } from "../components/Login";
import { Signup } from "../components/Signup";
import { UserNavbar } from "../components/user/UserNavbar";
import { AdminSidebar } from "../components/admin/AdminSidebar";
import { UserList } from "../components/admin/UserList";
import { ProductList } from "../components/user/ProductList";
import { UseEffectList } from "../components/user/UseEffectList";

const router = createBrowserRouter([
    {path:"/",element:<Login/>},
    {path:"/signup",element:<Signup/>},
    {path:"/user",element:<UserNavbar/>,
        children:[
            {path:"products",element:<ProductList/>},
            {path:"userlist",element:<UseEffectList/>},

        ]
    },
    {path:"/admin",element:<AdminSidebar/>,
        children:[
            {path:"users",element:<UserList/>}
        ]
    }

])

const AppRoutes = ()=>{
        return <RouterProvider router={router} />
}

export default AppRoutes