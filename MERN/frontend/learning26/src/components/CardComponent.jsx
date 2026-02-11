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
    link
}) => {

    return (
        <Link to={link} style={{ textDecoration: "none", color: "inherit" }}>
            <div className='card' style={{ backgroundImage: `url(${image})` }}>
                
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
