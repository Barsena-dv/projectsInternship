import axios from 'axios';
import { useState } from 'react';
import "../../assets/table.css";

export const Api3 = () => {
    const [comments, setcomments] = useState([]);

    const getComments = async () => {
        const response = await axios.get("https://dummyjson.com/comments");
        console.log(response.data.comments);
        setcomments(response.data.comments);
    }

    return (
        <div>
            <div className="api-page-header">
                <h1>Comments API</h1>
                <p>Fetch comments data from the DummyJSON API</p>
                <button className="btn-fetch" onClick={() => { getComments() }}>GET Comments</button>
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
                                <th>Username</th>
                                <th>Full Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                comments.map((comment) => {
                                    return <tr key={comment.id}>
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
