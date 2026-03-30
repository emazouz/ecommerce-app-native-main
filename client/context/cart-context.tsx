import api from "@/constants/api";
import { Product } from "@/constants/types";
import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Toast from "react-native-toast-message";

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
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [cartTotal, setCartTotal] = useState<number>(0);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        router.replace("/sign-in");
        return;
      }
      // get cart
      const { data } = await api.get("/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success && data.data) {
        const serverCart = data.data;
        const mappedCartItems: CartItem[] = serverCart.items.map(
          (item: any) => ({
            id: item.product._id,
            productId: item.product._id,
            product: item.product as Product,
            quantity: item.quantity,
            size: item?.size || "M",
            price: item.price,
          }),
        );
        setCartItems(mappedCartItems);
        setCartTotal(serverCart.totalAmount);
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error.response.data.message || "Failed to fetch cart",
      })
    } finally {
      setLoading(false);
    }
  }, [getToken, router]);

  // add to cart
  const addToCart = async (product: Product, size: string) => {
    if (!isSignedIn) {
      Toast.show({
        type: "error",
        text1: "Please sign in to add items to cart",
      });
      router.replace("/sign-in");
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        router.replace("/sign-in");
        return;
      }
      // add to cart
      const { data } = await api.post(
        "/cart",
        {
          productId: product._id,
          quantity: 1,
          size,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (data.success) {
        await fetchCart();
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error.response.data.message || "Failed to add item to cart",
      });
    } finally {
      setLoading(false);
    }
  };

  // remove from cart
  const removeFromCart = async (cartItemId: string, size: string) => {
    // remove item with matching id and size
    if (!isSignedIn) {
      return Toast.show({
        type: "error",
        text1: "Please sign in to remove items from cart",
      });
    }
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        router.replace("/sign-in");
        return;
      }
      // remove from cart
      const { data } = await api.delete(
        `/cart/item/${cartItemId}?size=${size}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (data.success) {
        await fetchCart();
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error.response.data.message || "Failed to remove item from cart",
      });
    } finally {
      setLoading(false);
    }
  };

  // update quantity
  const updateQuantity = async (
    cartItemId: string,
    quantity: number,
    size: string,
  ) => {
    // find item and update quantity
    if (!isSignedIn) {
      return Toast.show({
        type: "error",
        text1: "Please sign in to update quantity",
      });
    }
    if (quantity <= 0) {
      return;
      // await removeFromCart(cartItemId, size);
    }
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        router.replace("/sign-in");
        return;
      }
      // update quantity
      const { data } = await api.put(
        `/cart/item/${cartItemId}`,
        {
          size,
          quantity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (data.success) {
        await fetchCart();
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error.response.data.message || "Failed to update quantity",
      });
    } finally {
      setLoading(false);
    }
  };

  // clear cart
  const clearCart = async () => {
    // clear cart
    if (!isSignedIn) {
      return Toast.show({
        type: "error",
        text1: "Please sign in to clear cart",
      });
    }
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        router.replace("/sign-in");
        return;
      }
      // clear cart
      const { data } = await api.delete("/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        await fetchCart();
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error.response.data.message || "Failed to clear cart",
      });
    } finally {
      setLoading(false);
    }
  };

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    if (isSignedIn) {
      fetchCart();
    } else {
      setCartItems([]);
      setCartTotal(0);
    }
  }, [fetchCart, isSignedIn]);

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
