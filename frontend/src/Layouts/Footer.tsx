import Logo from "../assets/blood-donation-svgrepo-com.svg";
import { BsTwitterX } from "react-icons/bs";
import { FaFacebookF, FaInstagram, FaGithub, FaGlobe } from "react-icons/fa";


const Footer = () => {
    return (
        <footer className="bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

                    {/* Logo and Description */}
                    <div>
                        <img src={Logo} alt="Logo" className="h-20 w-auto cursor-pointer" />
                        <p className="mt-6 text-gray-600 text-sm">
                            Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim.
                        </p>
                        <div className="flex space-x-3 mt-6">
                            {[BsTwitterX, FaFacebookF, FaInstagram, FaGithub, FaGlobe].map((Icon, idx) => (
                                <a
                                    key={idx}
                                    href="#"
                                    className="w-8 h-8 flex items-center justify-center bg-gray-800 text-white rounded-full hover:bg-blue-600 transition"
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase">Company</h3>
                        <ul className="mt-6 space-y-4 text-sm text-gray-700">
                            {[
                                { label: "About", href: "/about" },
                                { label: "Features", href: "/features" },
                                { label: "Works", href: "/works" },
                                { label: "Career", href: "/career" },
                            ].map((item, idx) => (
                                <li key={idx}>
                                    <a href= {item.href} className="hover:text-blue-600 transition">{item.label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Help Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase">Help</h3>
                        <ul className="mt-6 space-y-4 text-sm text-gray-700">
                            {["Customer Support", "Delivery Details", "Terms & Conditions", "Privacy Policy"].map((item, idx) => (
                                <li key={idx}>
                                    <a href="#" className="hover:text-blue-600 transition">{item}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase">Subscribe to Newsletter</h3>
                        <form className="mt-6">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                className="mt-3 w-full bg-blue-600 text-white text-sm py-2 rounded-md hover:bg-blue-700 transition"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 border-t pt-6 text-sm text-gray-500 text-center">
                    © {new Date().getFullYear()} <span className="text-red-700 ">BloodConnect</span>. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
