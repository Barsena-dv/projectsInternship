import React, { useState } from 'react'

export const InputTask2 = () => {

  const courseDepartments = {
    "India": [
      "Gujarat",
      "Maharashtra",
      "Rajasthan",
      "Tamil Nadu",
      "Karnataka",
      "Uttar Pradesh",
      "Madhya Pradesh"
    ],

    USA: [
      "California",
      "Texas",
      "Florida",
      "New York",
      "Illinois",
      "Washington"
    ],

    Canada: [
      "Ontario",
      "Quebec",
      "British Columbia",
      "Alberta",
      "Manitoba"
    ],

    Australia: [
      "New South Wales",
      "Victoria",
      "Queensland",
      "Western Australia",
      "Tasmania"
    ],

    Germany: [
      "Bavaria",
      "Berlin",
      "Hamburg",
      "Hesse",
      "Saxony"
    ],

    UK: [
      "England",
      "Scotland",
      "Wales",
      "Northern Ireland"
    ],

    Brazil: [
      "São Paulo",
      "Rio de Janeiro",
      "Bahia",
      "Paraná",
      "Minas Gerais"
    ],

    Japan: [
      "Tokyo",
      "Osaka",
      "Kyoto",
      "Hokkaido",
      "Fukuoka"
    ],

    China: [
      "Guangdong",
      "Beijing",
      "Shanghai",
      "Zhejiang",
      "Sichuan"
    ],

    UAE: [
      "Abu Dhabi",
      "Dubai",
      "Sharjah",
      "Ajman",
      "Ras Al Khaimah"
    ]
  }
  const [input, setInput] = useState({
    country: "",
    state: "",
  });

  const handleChange = (data) => {
    const { name, value } = data.target;
    setInput(prev => ({
      ...prev,
      [name]: value,
      ...(name === "country" && { state: "" })
    }))
  }

  return (
    <div>
      <h1>Input Task 2</h1>
      <div className="form-group">
        <label>Country</label>
        <select name="country" value={input.country} onChange={handleChange}>
          <option value="">Select Country</option>
          <option value="India">India</option>
          <option value="USA">USA</option>
          <option value="Canada">Canada</option>
          <option value="Australia">Australia</option>
          <option value="Germany">Germany</option>
          <option value="UK">UK</option>
          <option value="Brazil">Brazil</option>
          <option value="Japan">Japan</option>
          <option value="China">China</option>
          <option value="UAE">UAE</option>

        </select>
        <label>Department</label>

        <select
          name="state"
          value={input.state}
          onChange={handleChange}
          disabled={!input.country}
        >
          <option value="">Select Department</option>

          {courseDepartments[input.country]?.map((state) => (
            <option key={state.value} value={state.value}>
              {state}
            </option>
          ))}
        </select>
      </div>

    </div>
  )
}
