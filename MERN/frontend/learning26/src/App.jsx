import { useState } from 'react'
import { HeaderComponent } from './components/HeaderComponent'
import { ContentComponent } from './components/ContentComponent'
import { FooterComponent } from './components/FooterComponent'
//import reactLogo from './assets/react.svg'
//import viteLogo from '/vite.svg'
import './App.css'
import { MapDemo1 } from './components/MapDemo1'
import { MapDemo2 } from './components/MapDemo2'
import { MapDemo3 } from './components/MapDemo3'
import { MapDemo4 } from './components/MapDemo4'
import { MapDemo5 } from './components/MapDemo5'
import { MapDemo6 } from './components/MapDemo6'
import { MapDemo7 } from './components/MapDemo7'
import { MapDemo8 } from './components/MapDemo8'
import { MapDemo9 } from './components/MapDemo9'
import { MapDemo10 } from './components/MapDemo10'
import { Route, Routes } from 'react-router-dom'
import { NetflixHome } from './components/NetflixHome'
import { NetflixShows } from './components/NetflixShows'
import { NetflixMovies } from './components/NetflixMovies'
import { HomeComponent } from './components/HomeComponent'
import { NavBar } from './components/NavBar'
import { ErrorNotFound } from './components/ErrorNotFound'
import { Watch } from './components/Watch'
import { IplTeam } from './components/IplTeam'
import { Playing } from './components/Playing'
import { UseState1 } from './components/UseState1'
import { Alert1 } from './components/Alert1'
import { UseState2 } from './components/UseState2'

function App() {
  //const [count, setCount] = useState(0)



  return (
      <div style={{backgroundColor: "rgb(0,0,0)", color: "rgb(232,152,138)"}}>
        <NavBar></NavBar>
          <Routes>
            <Route path='/' element={<HomeComponent/>}></Route>
            <Route path='/netflixhome' element={<NetflixHome/>}></Route>
            <Route path='/netflixshows' element={<NetflixShows/>}></Route>
            <Route path='/netflixmovies' element={<NetflixMovies/>}></Route>
            <Route path='/iplteams' element={<IplTeam/>}></Route>
            <Route path='/mapdemo6' element={<MapDemo6/>}></Route>
            <Route path='/mapdemo7' element={<MapDemo7/>}></Route>
            <Route path='/mapdemo8' element={<MapDemo8/>}></Route>
            <Route path='/mapdemo9' element={<MapDemo9/>}></Route>
            <Route path='/mapdemo10' element={<MapDemo10/>}></Route>
            <Route path='/state1' element={<UseState1/>}></Route>
            <Route path='/state2' element={<UseState2/>}></Route>
            <Route path='/alert1' element={<Alert1/>}></Route>
            <Route path='/*' element={<ErrorNotFound/>}></Route>
            <Route path='/watch/:name' element={<Watch/>}></Route>
            <Route path='/play/:name' element={<Playing/>}></Route>
          </Routes>
      </div>
  )
}

export default App
