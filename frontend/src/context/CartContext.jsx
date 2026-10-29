import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

const CartContext = createContext();

export function CartProvider({ children }) {

    // ==============================
    // PANIER
    // ==============================

    const [cartItems, setCartItems] = useState(() => {

        try {

            const savedCart =
                localStorage.getItem("cart");

            return savedCart
                ? JSON.parse(savedCart)
                : [];

        } catch (error) {

            console.error(
                "Erreur lecture panier :",
                error
            );

            return [];

        }

    });


    // ==============================
    // NOTIFICATION
    // ==============================

    const [notification, setNotification] =
        useState(null);


    // ==============================
    // SAUVEGARDER LE PANIER
    // ==============================

    useEffect(() => {

        localStorage.setItem(
            "cart",
            JSON.stringify(cartItems)
        );

    }, [cartItems]);


    // ==============================
    // AFFICHER NOTIFICATION
    // ==============================

    const showNotification = (message) => {

        setNotification({
            message
        });


        setTimeout(() => {

            setNotification(null);

        }, 3000);

    };


    // ==============================
    // AJOUTER AU PANIER
    // ==============================

    const addToCart = (pneu, quantity = 1) => {

        setCartItems((currentItems) => {

            const existingItem = currentItems.find(
                (item) => item.id === pneu.id
            );


            // ==============================
            // LE PNEU EXISTE DÉJÀ
            // ==============================

            if (existingItem) {

                const nouvelleQuantite =
                    Number(existingItem.quantity) +
                    Number(quantity);


                // Ne jamais dépasser le stock

                const quantiteFinale = Math.min(
                    nouvelleQuantite,
                    Number(pneu.stock)
                );


                return currentItems.map((item) =>

                    item.id === pneu.id

                        ? {
                            ...item,
                            quantity: quantiteFinale
                        }

                        : item

                );

            }


            // ==============================
            // NOUVEAU PNEU
            // ==============================

            const quantiteFinale = Math.min(
                Number(quantity),
                Number(pneu.stock)
            );


            return [

                ...currentItems,

                {
                    ...pneu,
                    quantity: quantiteFinale
                }

            ];

        });


        // ==============================
        // NOTIFICATION
        // ==============================

        showNotification(
            `${pneu.modele} a été ajouté au panier`
        );

    };


    // ==============================
    // AUGMENTER QUANTITÉ
    // ==============================

    const increaseQuantity = (id) => {

        setCartItems((currentItems) =>

            currentItems.map((item) => {

                if (item.id !== id) {
                    return item;
                }


                const nouvelleQuantite =
                    Number(item.quantity) + 1;


                // Ne pas dépasser le stock

                if (
                    nouvelleQuantite >
                    Number(item.stock)
                ) {

                    return item;

                }


                return {

                    ...item,

                    quantity: nouvelleQuantite

                };

            })

        );

    };


    // ==============================
    // DIMINUER QUANTITÉ
    // ==============================

    const decreaseQuantity = (id) => {

        setCartItems((currentItems) =>

            currentItems

                .map((item) => {

                    if (item.id !== id) {
                        return item;
                    }


                    return {

                        ...item,

                        quantity:
                            Number(item.quantity) - 1

                    };

                })


                .filter(
                    (item) =>
                        Number(item.quantity) > 0
                )

        );

    };


    // ==============================
    // SUPPRIMER DU PANIER
    // ==============================

    const removeFromCart = (id) => {

        setCartItems((currentItems) =>

            currentItems.filter(
                (item) =>
                    item.id !== id
            )

        );

    };


    // ==============================
    // VIDER LE PANIER
    // ==============================

    const clearCart = () => {

        setCartItems([]);

    };


    // ==============================
    // NOMBRE TOTAL D'ARTICLES
    // ==============================

    const cartCount = cartItems.reduce(

        (total, item) =>

            total +
            Number(item.quantity),

        0

    );


    // ==============================
    // TOTAL DU PANIER
    // ==============================

    const cartTotal = cartItems.reduce(

        (total, item) =>

            total +
            Number(item.prix) *
            Number(item.quantity),

        0

    );


    // ==============================
    // CONTEXT
    // ==============================

    return (

        <CartContext.Provider
            value={{

                cartItems,

                addToCart,

                increaseQuantity,

                decreaseQuantity,

                removeFromCart,

                clearCart,

                cartCount,

                cartTotal,

                // Notification
                notification,

                setNotification

            }}
        >

            {children}

        </CartContext.Provider>

    );

}


// ==============================
// HOOK PERSONNALISÉ
// ==============================

export function useCart() {

    return useContext(CartContext);

}