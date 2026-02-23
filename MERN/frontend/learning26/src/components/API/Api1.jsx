import axios from 'axios';
import { useState } from 'react';
import "../../assets/table.css";

export const Api1 = () => {

    const [message, setmessage] = useState("");
    const [users, setusers] = useState([])

    const getUsers = async () => {
        const response = await axios.get("https://node5.onrender.com/user/user/");
        console.log(response);
        setmessage(response.data.message);
        setusers(response.data.data);
    }

    return (
        <div>
            <div className="api-page-header">
                <h1>Users API</h1>
                <p>Fetch user records from the live backend</p>
                <button className="btn-fetch" onClick={() => { getUsers() }}>GET Users</button>
                {message && <p style={{ marginTop: "12px", color: "var(--teal)", fontWeight: 600 }}>{message}</p>}
            </div>
            <div className="page">
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Id</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Age</th>
                                <th>Available</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                users.map((user) => {
                                    return <tr key={user._id}>
                                        <td>{user._id}</td>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{user.age}</td>
                                        <td>{user.isActive ? "Yes" : "No"}</td>
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
