import "./Notification.css";

import {
    FaCheckCircle,
    FaTimes
} from "react-icons/fa";

function Notification({ notification, onClose }) {

    if (!notification) {
        return null;
    }

    return (

        <div className="notification-toast">

            <div className="notification-icon">

                <FaCheckCircle />

            </div>


            <div className="notification-content">

                <strong>
                    Ajouté au panier
                </strong>

                <span>
                    {notification.message}
                </span>

            </div>


            <button
                type="button"
                className="notification-close"
                onClick={onClose}
            >

                <FaTimes />

            </button>

        </div>

    );
}

export default Notification;