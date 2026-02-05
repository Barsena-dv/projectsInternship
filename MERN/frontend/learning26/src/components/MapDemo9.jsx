import React from 'react'

export const MapDemo9 = () => {

    let books = [
        {
            id: 1,
            title: "Harry Potter and the Philosopher's Stone",
            author: "J.K. Rowling",
            genre: "Fantasy",
            published: "1997",
            language: "English",
            pages: "223",
            rating: "4.8/5",
            img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrv1xyW2GnLl0fV84ptDhlAsoMiJP87qokW2zBo3z4uB8na-k1j7L4sScqtpOjgrokfEDcMicnzSz3DR7v_j1eoVADBX4ViEQhm6KfW7li_g&s=10"
        },
        {
            id: 2,
            title: "The Lord of the Rings",
            author: "J.R.R. Tolkien",
            genre: "Epic Fantasy",
            published: "1954",
            language: "English",
            pages: "1178",
            rating: "4.9/5",
            img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTf21KJ-PVLba8I8T8WrpA6LGu6oIi6X0fkN-oe9CLouFdeusPdAjDjnfEWJIlIwVkgRWDQ38SGcAwEUvIuIlHVqDm8FNY-wa8rM3ML7TPjqg&s=10"
        },
        {
            id: 3,
            title: "The Alchemist",
            author: "Paulo Coelho",
            genre: "Adventure / Philosophy",
            published: "1988",
            language: "Portuguese",
            pages: "208",
            rating: "4.7/5",
            img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrv1xyW2GnLl0fV84ptDhlAsoMiJP87qokW2zBo3z4uB8na-k1j7L4sScqtpOjgrokfEDcMicnzSz3DR7v_j1eoVADBX4ViEQhm6KfW7li_g&s=10"
        },
        {
            id: 4,
            title: "Think and Grow Rich",
            author: "Napoleon Hill",
            genre: "Self-help",
            published: "1937",
            language: "English",
            pages: "238",
            rating: "4.6/5",
            img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrv1xyW2GnLl0fV84ptDhlAsoMiJP87qokW2zBo3z4uB8na-k1j7L4sScqtpOjgrokfEDcMicnzSz3DR7v_j1eoVADBX4ViEQhm6KfW7li_g&s=10"
        },
        {
            id: 5,
            title: "Atomic Habits",
            author: "James Clear",
            genre: "Self-help / Productivity",
            published: "2018",
            language: "English",
            pages: "320",
            rating: "4.8/5",
            img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSm3imhF56YJVmVLfPtqugAclO3I-CLp8csy-Pnc-VynFvfadIvG_tZBBkpyy8AbhTsiSu5jj89U6u5FLXAUxWvEDC5CrBNjUv4h1mSUlTA&s=10"
        },
        {
            id: 6,
            title: "Rich Dad Poor Dad",
            author: "Robert T. Kiyosaki",
            genre: "Personal Finance",
            published: "1997",
            language: "English",
            pages: "336",
            rating: "4.7/5",
            img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrv1xyW2GnLl0fV84ptDhlAsoMiJP87qokW2zBo3z4uB8na-k1j7L4sScqtpOjgrokfEDcMicnzSz3DR7v_j1eoVADBX4ViEQhm6KfW7li_g&s=10"
        },
        {
            id: 7,
            title: "The Power of Your Subconscious Mind",
            author: "Joseph Murphy",
            genre: "Psychology / Self-help",
            published: "1963",
            language: "English",
            pages: "308",
            rating: "4.6/5",
            img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrwCffYfxBZFlqtC6AnZYSwjbyYu5OGQHgqhsE-TEpXoFMn74nQHCeS-qWxXOmOUsHmZ_aj9RsyTmjXOQYdzwhECreasg818B9_M9a_d0MeA&s=10"
        },
        {
            id: 8,
            title: "The Kite Runner",
            author: "Khaled Hosseini",
            genre: "Drama / Fiction",
            published: "2003",
            language: "English",
            pages: "371",
            rating: "4.7/5",
            img: ""
        }
    ];



    return (
        <div className='page'>
            <h1 className='page-title'>Books</h1>

            <div className="table-wrapper">
                <table className='data-table'>
                    <thead>
                        <tr style={{ backgroundColor: "gray" }}>
                            <th>Id</th>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Genre</th>
                            <th>Published</th>
                            <th>Language</th>
                            <th>Pages</th>
                            <th>Rating</th>
                            <th>Best Seller</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            books.map((book) => {

                                const pub = book.published;

                                return <tr>
                                    <td>{book.id}</td>
                                    <td>{book.title}</td>
                                    <td>{book.author}</td>
                                    <td>{book.genre}</td>
                                    <td className={`${pub < 1980 ? "cell-success" : "cell-danger"}`}>{book.published}</td>
                                    <td>{book.language}</td>
                                    <td>{book.pages}</td>
                                    <td>{book.rating}</td>
                                    <td>
                                        <img
                                            src={book.img}
                                            alt={book.title}
                                            style={{ width: "70px", height: "90px", objectFit: "cover" }}
                                        />
                                    </td>

                                </tr>
                            })
                        }
                    </tbody>
                </table>
            </div>
        </div>
    )
}
