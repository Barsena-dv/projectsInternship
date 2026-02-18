import axios from 'axios'
import React, { useState } from 'react'
import { TableComponent } from '../TableComponent';

export const Api3 = () => {
    const [comments, setcomments] = useState([]);
    const getComments = async () => {
        const response = await axios.get("https://dummyjson.com/comments");
        console.log(response.data.comments);
        setcomments(response.data.comments);
    }
    return (
        <div>
            <div style={{ textAlign: "center" }}>
                <h1>Api 3</h1>
                <button onClick={() => {getComments()}}>GET</button>
            </div>
            <div className="page">
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Id</th>
                                <th>Body</th>
                                <th>Post Id</th>
                                <th>Likes</th>
                                <th>Name</th>
                                <th>Full Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                comments.map((comment)=>{
                                    return <tr>
                                        <td>{comment.id}</td>
                                        <td>{comment.body}</td>
                                        <td>{comment.postId}</td>
                                        <td>{comment.likes}</td>
                                        <td>{comment.user.username}</td>
                                        <td>{comment.user.fullName}</td>
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
