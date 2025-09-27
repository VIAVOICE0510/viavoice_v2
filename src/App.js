import React from 'react'
import CardsSection from './components/CardsSection'
import RightPanel from './components/RightPanel'
import './app.css'
export default function App() {
  window.addEventListener('wheel', function (e) {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });
  return (
    <div className='container-fluid px-5'>
      <CardsSection/>
      <RightPanel/>
    </div>
  )
}
