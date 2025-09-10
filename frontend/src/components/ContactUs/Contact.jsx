import "./contact.css";
import swal from "sweetalert2";

const ContactUs = () => {
  const onSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    formData.append("access_key", "9944262f-20cf-4d0c-8402-fa9cb8c793f5");

    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: json,
      });

      const data = await res.json();

      if (data.success) {
        swal.fire({
          title: "Success!",
          text: "Form submitted successfully!",
          icon: "success",
        });
        event.target.reset(); // ✅ reset form after success
      } else {
        swal.fire({
          title: "Error!",
          text: data.message || "Error submitting form.",
          icon: "error",
        });
      }
    } catch (error) {
      swal.fire({
        title: "Error!",
        text: "Something went wrong.",
        icon: "error",
      });
    }
  };

  return (
    <section className="contact">
      <form onSubmit={onSubmit} className="contactForm">
        <h2>Contact Us</h2>

        <div className="input-box">
          <label className="contactLabel" htmlFor="name">Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            id="name"
            className="field"
            required
          />
        </div>

        <div className="input-box">
          <label className="contactLabel" htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            id="email"
            className="field"
            required
          />
        </div>

        <div className="input-box">
          <label className="contactLabel" htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            className="field mess"
            required
            placeholder="Your message here..."
          ></textarea>
        </div>

        {/* ✅ fixed className + inline style */}
        <input
          type="checkbox"
          name="botcheck"
          className="hidden"
          style={{ display: "none" }}
        />

        <button className="contactButton" type="submit">Submit</button>
      </form>
    </section>
  );
};

export default ContactUs;
