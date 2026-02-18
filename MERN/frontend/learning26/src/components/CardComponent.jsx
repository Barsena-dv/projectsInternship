import React from 'react'
import { Link } from 'react-router-dom'
import "../assets/moviesCard.css"

export const CardComponent = ({

    image,
    rating,
    year,
    subtitle,
    description,
    extra,
    link,
    title
}) => {
    const [imgError, setImgError] = React.useState(false);

    const safeTitle = title && title !== "N/A" ? title : "Movie";

    const poster =
        !imgError && image && image !== "N/A"
            ? image
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(safeTitle)}&background=8b0000&color=fff&size=512`;
    React.useEffect(() => {
        setImgError(false);
    }, [image]);

    React.useEffect(() => {
        if (!image || image === "N/A") return;

        const img = new Image();
        img.src = image;
        img.onerror = () => setImgError(true);
    }, [image]);

    return (
        <Link to={link} style={{ textDecoration: "none", color: "inherit" }}>
            <div className='card' style={{ backgroundImage: `url(${poster})` }}>

                {rating && <p className='rating'>{rating}</p>}

                <div className='specs'>
                    {(year || subtitle) && (
                        <p>{year} {subtitle && `• ${subtitle}`}</p>
                    )}

                    <p className='specs description'>{description}</p>
                </div>

                {extra && <p className='duration'>{extra}</p>}
            </div>
        </Link>
    )
}
