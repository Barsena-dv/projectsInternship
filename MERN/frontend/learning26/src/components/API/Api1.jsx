import axios from 'axios';
import React, { useState } from 'react'
import "../../assets/table.css"

export const Api1 = () => {

    const [message, setmessage] = useState("");
    const [users, setusers] = useState([])

    const getUsers = async ()=>{
        const response = await axios.get("https://node5.onrender.com/user/user/");
        console.log(response);
        console.log(response.data);
        console.log(response.data.message);
        setmessage(response.data.message);
        console.log(response.data.data);
        setusers(response.data.data);
    }
    return (
        <div >
            <div style={{textAlign:"center"}}>
                
            <h1>Api 1</h1>
            <button onClick={()=>{getUsers()}}>GET</button>
            <h1>Message: {message}</h1>
            </div>
            <div className="page">
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Id</th>
                                <th>Name</th>
                                <th>Email</th>
                                {/* <th>Password</th> */}
                                <th>Age</th>
                                <th>Available</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                users.map((user)=>{
                                    return <tr>
                                        <td>{user._id}</td>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        {/* <td>{user.password}</td> */}
                                        <td>{user.age}</td>
                                        <td >{user.isActive ? "Yes":"No"}</td>
                                    </tr>
                                })
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
