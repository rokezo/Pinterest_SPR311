import Navbar from './Navbar'
import PinGrid from './PinGrid'
import './Home.css'

const Home = () => {
  return (
    <div className="home-container">
      <Navbar />
      <main className="home-main">
        <PinGrid />
      </main>
    </div>
  )
}

export default Home

