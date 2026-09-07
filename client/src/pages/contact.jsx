
import React from 'react'

const Contact = () => {
    return (
        <section className="bg-[#f7f7f5]">
            <div className="container px-6 py-12 mx-auto">

                {/* Header */}
                <div>
                    <p className="font-semibold text-[#d97706]">
                        Contact Us
                    </p>

                    <h1 className="mt-2 text-2xl font-bold text-[#b45309] md:text-3xl">
                        Get in touch with Shree Shyam Mart
                    </h1>

                    <p className="mt-3 text-[#c0844a]">
                        Have a question about our products, orders, or delivery?
                        We're always happy to help.
                    </p>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 gap-12 mt-10 md:grid-cols-2 lg:grid-cols-3">

                    {/* Email */}
                    <div>
                        <span className="inline-block p-3 text-[#d97706] rounded-full bg-[#fff1dc]">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.8"
                                stroke="currentColor"
                                className="w-6 h-6"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                                />
                            </svg>
                        </span>

                        <h2 className="mt-4 text-lg font-bold text-[#b45309]">
                            Email
                        </h2>

                        <p className="mt-2 text-[#c0844a]">
                            Our team is here to help you.
                        </p>

                        <a
                            href="mailto:shreeshyammart11@gmail.com"
                            className="inline-block mt-2 font-semibold text-[#d97706] hover:text-[#b45309] hover:underline"
                        >
                            shreeshyammart11@gmail.com
                        </a>
                    </div>

                    {/* Store Address */}
                    <div>
                        <span className="inline-block p-3 text-[#d97706] rounded-full bg-[#fff1dc]">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.8"
                                stroke="currentColor"
                                className="w-6 h-6"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                                />

                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                                />
                            </svg>
                        </span>

                        <h2 className="mt-4 text-lg font-bold text-[#b45309]">
                            Visit Our Store
                        </h2>

                        <p className="mt-2 text-[#c0844a]">
                            We'd love to welcome you at our store.
                        </p>

                        <p className="mt-2 leading-6 font-semibold text-[#d97706]">
                            Shop No. G1, G2, Shaktuntala Complex,
                            <br />
                            Above Coffee House, Opposite Kailasha Apartment,
                            <br />
                            Baliapur Road, Dhanbad - 826001
                        </p>
                    </div>

                    {/* Phone */}
                    <div>
                        <span className="inline-block p-3 text-[#d97706] rounded-full bg-[#fff1dc]">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.8"
                                stroke="currentColor"
                                className="w-6 h-6"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                                />
                            </svg>
                        </span>

                        <h2 className="mt-4 text-lg font-bold text-[#b45309]">
                            Call Us
                        </h2>

                        <p className="mt-2 text-[#c0844a]">
                            We're happy to assist you.
                        </p>

                        <a
                            href="tel:+919204234193"
                            className="inline-block mt-2 font-semibold text-[#d97706] hover:text-[#b45309] hover:underline"
                        >
                            +91 92042 34193
                        </a>
                    </div>

                </div>

                {/* Bottom Message */}
                <div className="mt-16 p-6 text-center rounded-xl bg-[#fffaf2] border border-[#f5dfc2]">
                    <h2 className="text-xl font-bold text-[#b45309]">
                        We're here for you!
                    </h2>

                    <p className="mt-2 text-[#c0844a]">
                        Whether you need help with an order, want to know more
                        about a product, or simply have a question, feel free
                        to reach out to us.
                    </p>
                </div>

            </div>
        </section>
    )
}

export default Contact