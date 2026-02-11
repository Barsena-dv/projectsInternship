import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import "../../assets/Form.css"

export const FormTask3 = () => {

    const { register, handleSubmit } = useForm();
    const [bookData, setbookData] = useState({});
    const [isSubmited, setisSubmited] = useState(false);

    const submityHandler = (data) => {
        setbookData(data);
        setisSubmited(true);
        console.log(data);
    }

    return (
        <div className="page">
            <div className="form-card">
                <h1 className="title">Library Book Entry</h1>

                <form onSubmit={handleSubmit(submityHandler)} className="form">

                    {/* Title */}
                    <div className="form-group">
                        <label>Book Title</label>
                        <input type="text" {...register("title")} />
                    </div>

                    {/* Author */}
                    <div className="form-group">
                        <label>Author</label>
                        <input type="text" {...register("author")} />
                    </div>

                    {/* ISBN Pattern */}
                    <div className="form-group">
                        <label>ISBN Number</label>
                        <input
                            type="text"
                            placeholder="978-1234567890"
                            {...register("isbn", {pattern: /^[0-9\- ]{10,17}$/})}
                        />
                    </div>

                    {/* Genre multi select */}
                    <div className="form-group">
                        <label>Genre</label>
                        <select multiple {...register("genre")}>
                            <option value="Fantasy">Fantasy</option>
                            <option value="SciFi">Sci-Fi</option>
                            <option value="Mystery">Mystery</option>
                            <option value="Romance">Romance</option>
                            <option value="Programming">Programming</option>
                            <option value="History">History</option>
                        </select>
                    </div>

                    {/* Language */}
                    <div className="form-group">
                        <label>Language</label>
                        <input list="languages" {...register("language")} />
                        <datalist id="languages">
                            <option value="English"/>
                            <option value="Hindi"/>
                            <option value="Gujarati"/>
                            <option value="Japanese"/>
                        </datalist>
                    </div>

                    {/* Format radio */}
                    <div className="form-group">
                        <label>Format</label>
                        <div className="radio-group">
                            <label><input type="radio" value="Hardcover" {...register("format")} /> Hardcover</label>
                            <label><input type="radio" value="Paperback" {...register("format")} /> Paperback</label>
                            <label><input type="radio" value="Ebook" {...register("format")} /> Ebook</label>
                        </div>
                    </div>

                    {/* Pages range */}
                    <div className="form-group">
                        <label>Number of Pages</label>
                        <input type="range" min="50" max="1500" {...register("pages")} />
                    </div>

                    {/* Rating slider */}
                    <div className="form-group">
                        <label>Reader Rating (0-5)</label>
                        <input type="range" min="0" max="5" step="0.5" {...register("rating")} />
                    </div>

                    {/* Availability */}
                    <div className="form-group">
                        <label>
                            <input type="checkbox" {...register("available")} />
                            Available in Library
                        </label>
                    </div>

                    {/* Cover color */}
                    <div className="form-group">
                        <label>Cover Theme Color</label>
                        <input type="color" {...register("coverColor")} />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label>Description</label>
                        <textarea rows="4" {...register("description")}></textarea>
                    </div>

                    <button type="submit" className="submit-btn">Save Book</button>
                </form>
            </div>

            {isSubmited && (
                <div className="result-card">
                    <h3>Book Stored</h3>
                    <p><b>Title:</b> {bookData.title}</p>
                    <p><b>Author:</b> {bookData.author}</p>
                    <p><b>ISBN:</b> {bookData.isbn}</p>
                    <p><b>Language:</b> {bookData.language}</p>
                    <p><b>Format:</b> {bookData.format}</p>
                    <p><b>Pages:</b> {bookData.pages}</p>
                    <p><b>Rating:</b> {bookData.rating}</p>
                    <p><b>Available:</b> {bookData.available ? "Yes" : "No"}</p>
                </div>
            )}
        </div>
    )
}
