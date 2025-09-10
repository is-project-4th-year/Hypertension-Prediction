import "./footer.css"
import footerImage from "../../assets/images/logo2.png"
import ellipse4 from "../../assets/images/Ellipse 4.png"
import ellipse5 from "../../assets/images/ellipse5.png"


const Footer = () => {
    return (
        <>
            <div className="footer-container">

                <div className="footer-logo">
                    <img src={footerImage} alt="footer-logo" />
                    <p>We are a medical clinic,<br />helping you for a better life.</p>
                </div>

                <div className="footer-medic">
                <ul className="footer-lists2">
                    <li><strong>Shinikizua</strong></li>
                    <li><a href="#">Home</a></li>
                    <li><a href="#services">Our Services</a></li>
                    <li><a href="#doctors">Our Doctors</a></li>
                    <li><a href="#partners">Our Health Partners</a></li>
                    <li><a href="#testimonials">Testimonials</a></li>
                    <li><a href="#contact">Contact Us</a></li>

                </ul>
                </div>


                <div className="footer-about">
                    <ul className="footer-lists3">
                        <li>About</li>
                        <li>Shinikizua</li>
                        <li>Vision & Mission</li>
                        <li>Careers</li>
                        <li>Support</li>
                        <li>FAQ</li>
                    </ul>
                </div>

                <div className="footer-social-media">
                    <ul className="footer-lists4">
                        <li><a href="https://twitter.com/" target="_blank" rel="noopener noreferrer">Twitter / X</a></li>
                        <li><a href="https://facebook.com/" target="_blank" rel="noopener noreferrer">Facebook</a></li>
                        <li><a href="https://instagram.com/" target="_blank" rel="noopener noreferrer">Instagram</a></li>

                    </ul>
                </div>

                <div className="footer-contact">
                    <ul className="footer-lists5">
                        <li>Contact</li>
                        <li>Nairobi, Kenya </li>
                        <li>P.O. Box 2675-00200</li>
                        <li>0712448139</li>
                        <li>shinikizua@gmail.com</li>
                    </ul>
                </div>

                <img className="footer-ellipse1" src={ellipse4} alt="ellipse4" />
                <img className="footer-ellipse2" src={ellipse5} alt="ellipse5" />

            </div>

            <div className="footer-bottom">
                <p>&copy; Shinikizua 2025</p>
                <p>Legal Policies</p>
                <p>Sitemap</p>
                <p>Cookies</p>
            </div>

        </>


    )
}

export default Footer