import { dummyCart } from "@/assets/assets";
import { Product } from "@/assets/constants/types";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// cart item type
export type CartItem = {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  size?: string;
  price: number;
};

type CartContextType = {
  loading: boolean;
  cartItems: CartItem[];
  addToCart: (product: Product, size: string) => Promise<void>;
  removeFromCart: (cartItemId: string, size: string) => Promise<void>;
  updateQuantity: (
    cartItemId: string,
    quantity: number,
    size: string,
  ) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotal: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [cartTotal, setCartTotal] = useState<number>(0);

  const fetchCart = async () => {
    setLoading(true);
    const serverCart = dummyCart;
    const mappedCartItems: CartItem[] = serverCart.items.map((item) => ({
      id: item.product._id,
      productId: item.product._id,
      product: item.product as Product,
      quantity: item.quantity,
      size: item?.size || "M",
      price: item.price,
    }));
    setCartItems(mappedCartItems);
    setCartTotal(serverCart.totalAmount);
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // add to cart
  const addToCart = async (product: Product, size: string) => {
    // check if item with same product and size exists
  };

  // remove from cart
  const removeFromCart = async (cartItemId: string, size: string) => {
    // remove item with matching id and size
  };

  // update quantity
  const updateQuantity = async (
    cartItemId: string,
    quantity: number,
    size: string,
  ) => {
    // find item and update quantity
  };

  // clear cart
  const clearCart = async () => {
    // clear cart
  };

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartItems,
        cartTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
