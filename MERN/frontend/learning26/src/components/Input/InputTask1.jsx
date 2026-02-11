import React, { useState } from 'react'

export const InputTask1 = () => {

    const[name,setName] = useState("");
    const[age,setage] = useState(0);
    const[email,setemail] = useState("");
    const[date,setdate] = useState("");
    const[standard,setstandard] = useState("");
    const[country,setcountry] = useState("");
    const[city,setcity] = useState("");
    const[state,setstate] = useState("");
    const[height,setheight] = useState("");
    const[color,setcolor] = useState("");

    const nameHandler = (event) => {
        setName(event.target.value);
    }
    const ageHandler = (event) => {
        setage(event.target.value);
    }
    const emailHandler = (event) => {
        setemail(event.target.value);
    }
    const dateHandler = (event) => {
        setdate(event.target.value);
    }
    const standardHandler = (event) => {
        setstandard(event.target.value);
    }
    const countryHandler = (event) => {
        setcountry(event.target.value);
    }
    const cityHandler = (event) => {
        setcity(event.target.value);
    }
    const stateHandler = (event) => {
        setstate(event.target.value);
    }
    const heightHandler = (event) => {
        setheight(event.target.value);
    }
    const colorHandler = (event) => {
        setcolor(event.target.value);
    }
    return (
        <div>
            <h1>InputTask1</h1>
            <div>
                <label>Name: </label>
                <input type="text" onChange={(event)=> {nameHandler(event)}} />
                {name}
            </div>
            <div>
                <label>Age: </label>
                <input type="number" onChange={(event)=> {ageHandler(event)}} />
                {age}
            </div>
            <div>
                <label>Email: </label>
                <input type="text" onChange={(event)=> {emailHandler(event)}} />
                {email}
            </div>
            <div>
                <label>Date: </label>
                <input type="date" onChange={(event)=> {dateHandler(event)}} />
                {date}
            </div>
            <div>
                <label>Standard: </label>
                <input type="text" onChange={(event)=> {standardHandler(event)}} />
                {standard}
            </div>
            <div>
                <label>Country: </label>
                <input type="text" onChange={(event)=> {countryHandler(event)}} />
                {country}
            </div>
            <div>
                <label>City: </label>
                <input type="text" onChange={(event)=> {cityHandler(event)}} />
                {city}
            </div>
            <div>
                <label>State: </label>
                <input type="text" onChange={(event)=> {stateHandler(event)}} />
                {state}
            </div>
            <div>
                <label>Height: </label>
                <input type="text" onChange={(event)=> {heightHandler(event)}} />
                {height}
            </div>
            <div>
                <label>Color: </label>
                <input type="color" onChange={(event)=> {colorHandler(event)}} />
                {color}
            </div>
        </div>
    )
}
