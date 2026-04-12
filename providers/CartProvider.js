'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '@/providers/AuthProvider'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const { session } = useAuth()

  // 1. Initial Load: from localStorage, then from API if logged in
  useEffect(() => {
    const loadCart = async () => {
      // 1a. Load from localStorage
      const localCart = localStorage.getItem('cart')
      let initialCart = localCart ? JSON.parse(localCart) : []
      
      // 1b. If logged in, fetch from database and merge
      if (session?.access_token) {
        try {
          const res = await fetch('/api/cart', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          })
          if (res.ok) {
            const data = await res.json()
            initialCart = data.cartItems || []
          }
        } catch (e) {
          console.error("Failed to load DB cart", e)
        }
      }

      setCartItems(initialCart)
      setIsInitializing(false)
    }
    
    loadCart()
  }, [session?.access_token])

  // 2. Persist Side Effects: Save to localStorage AND Database API on every change
  useEffect(() => {
    if (isInitializing) return

    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cartItems))

    // Save to database
    if (session?.access_token) {
      fetch('/api/cart', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ cartItems })
      }).catch(e => console.error("Failed to sync cart", e))
    }
  }, [cartItems, isInitializing, session?.access_token])


  function addToCart(product) {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  function removeFromCart(productId) {
    setCartItems(prev => prev.filter(item => item.id !== productId))
  }

  function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCartItems(prev =>
      prev.map(item => item.id === productId ? { ...item, quantity } : item)
    )
  }

  function clearCart() {
    setCartItems([])
    setAppliedCoupon(null)
  }

  function applyCoupon(coupon) { setAppliedCoupon(coupon) }
  function removeCoupon() { setAppliedCoupon(null) }

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = appliedCoupon ? Math.round(cartTotal * (appliedCoupon.discountPercent / 100)) : 0
  const finalTotal = Math.max(0, cartTotal - discountAmount)

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        appliedCoupon,
        cartCount,
        cartTotal,
        discountAmount,
        finalTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
