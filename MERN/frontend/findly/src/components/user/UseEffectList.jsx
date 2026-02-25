import axios from 'axios'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

export const UseEffectList = () => {

    const [users, setusers] = useState([])

    const getUsers = async () => {

        const res = await axios.get("https://node5.onrender.com/user/user/")
        console.log("response...", res);
        setusers(res.data.data)
    }
    const deleteUser = async (id) => {
        // const confirmed = window.confirm('Are you sure you want to delete this user?');
        // if (!confirmed) return;
        const res = await axios.delete(`https://node5.onrender.com/user/user/${id}`);
        console.log(res);
        if (res.status == 204) {
            toast.success('User deleted successfully ✓');
            getUsers()
        }
    }
    //component --> load --> useEffec call --> function call..
    useEffect(() => {
        //api logic..
        getUsers()
    }, [])


    return (
        <div className="w-full">

            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-[#111827]">User List</h1>
                <p className="text-sm text-gray-500 mt-1">All registered users fetched from the API</p>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gradient-to-r from-[#1E40AF] to-[#2563EB] text-white">
                            <th className="px-6 py-4 text-left font-semibold tracking-wide">#</th>
                            <th className="px-6 py-4 text-left font-semibold tracking-wide">User ID</th>
                            <th className="px-6 py-4 text-left font-semibold tracking-wide">Name</th>
                            <th className="px-6 py-4 text-left font-semibold tracking-wide">Email</th>
                            <th className="px-6 py-4 text-left font-semibold tracking-wide">Status</th>
                            <th className="px-6 py-4 text-center font-semibold tracking-wide">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                                    Loading users...
                                </td>
                            </tr>
                        ) : (
                            users.map((user, index) => (
                                <tr
                                    key={user._id}
                                    className="hover:bg-blue-50 transition-colors duration-150 even:bg-gray-50"
                                >
                                    <td className="px-6 py-4 text-gray-400 font-medium">{index + 1}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-block bg-blue-50 text-[#2563EB] text-xs font-mono px-2 py-1 rounded-md max-w-[180px] truncate">
                                            {user._id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-[#111827]">{user.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4">
                                        {(() => {
                                            const isActive =
                                                user.status === 'active' ||
                                                user.status === true ||
                                                user.isActive === true ||
                                                user.isActive === 'active';
                                            return isActive ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                    Inactive
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => { deleteUser(user._id) }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-150"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                <path d="M10 11v6M14 11v6" />
                                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                            </svg>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Footer */}
                {users.length > 0 && (
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                        Showing {users.length} user{users.length !== 1 ? "s" : ""}
                    </div>
                )}

            </div>
        </div>
    );
}
