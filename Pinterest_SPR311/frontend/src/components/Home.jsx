import Navbar from './Navbar'
import Sidebar from './Sidebar'
import PinGrid from './PinGrid'
import './Home.css'

const Home = () => {
  return (
    <div className="home-container">
      <Navbar />
      <div className="home-layout">
        <Sidebar />
        <main className="home-main">
          <PinGrid />
        </main>
      </div>
    </div>
  )
}

export default Home

