import axios from 'axios'
import { useEffect, useState } from 'react'

export const UseEffectList = () => {

    const [users, setusers] = useState([])

    const getUsers = async () => {

        const res = await axios.get("https://node5.onrender.com/user/user/")
        console.log("response...", res);
        setusers(res.data.data)
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
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
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
