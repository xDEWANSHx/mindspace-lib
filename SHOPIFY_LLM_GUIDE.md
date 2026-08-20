# Shopify Storefront API LLM Integration Guide & GraphQL Skill

This document provides the exact GraphQL queries, mutations, and JavaScript client code required to connect a Headless Next.js/React storefront to Shopify Storefront API for Artificial Jewelry & Fashion products.

---

## 1. Shopify Storefront Fetch Client (`lib/shopify.js`)

```javascript
const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const apiVersion = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || '2024-01';

export async function shopifyFetch({ query, variables = {} }) {
  const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`;

  try {
    const result = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 60 }, // Cache revalidation in Next.js
    });

    const body = await result.json();

    if (body.errors) {
      console.error('Shopify GraphQL Errors:', body.errors);
      throw new Error(body.errors[0].message);
    }

    return body.data;
  } catch (error) {
    console.error('Shopify Fetch Error:', error);
    throw error;
  }
}
```

---

## 2. Core GraphQL Queries

### A. Fetch Product Catalog
```graphql
query getProducts($first: Int = 20) {
  products(first: $first) {
    edges {
      node {
        id
        title
        handle
        description
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 2) {
          edges {
            node {
              url
              altText
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              availableForSale
              price {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
}
```

### B. Fetch Single Product Details
```graphql
query getProductByHandle($handle: String!) {
  productByHandle(handle: $handle) {
    id
    title
    handle
    descriptionHtml
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 5) {
      edges {
        node {
          url
          altText
        }
      }
    }
    variants(first: 10) {
      edges {
        node {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
        }
      }
    }
  }
}
```

---

## 3. Shopify Cart & Checkout GraphQL Mutations

### A. Create Cart (`cartCreate`)
```graphql
mutation cartCreate($input: CartInput!) {
  cartCreate(input: $input) {
    cart {
      id
      checkoutUrl
      lines(first: 10) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                product {
                  title
                  handle
                }
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### B. Add Items to Existing Cart (`cartLinesAdd`)
```graphql
mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart {
      id
      checkoutUrl
      lines(first: 25) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                product {
                  title
                }
                price {
                  amount
                }
              }
            }
          }
        }
      }
    }
  }
}
```

---

## 4. Jewelry Specific Data Normalization Helper
Helper function to clean up Shopify nested GraphQL data into flat JSON objects for UI components:

```javascript
export function normalizeProduct(productNode) {
  if (!productNode) return null;
  return {
    id: productNode.id,
    title: productNode.title,
    handle: productNode.handle,
    description: productNode.description,
    price: parseFloat(productNode.priceRange?.minVariantPrice?.amount || 0),
    currency: productNode.priceRange?.minVariantPrice?.currencyCode || 'INR',
    primaryImage: productNode.images?.edges[0]?.node?.url || '/placeholder.jpeg',
    hoverImage: productNode.images?.edges[1]?.node?.url || productNode.images?.edges[0]?.node?.url,
    variantId: productNode.variants?.edges[0]?.node?.id,
    available: productNode.variants?.edges[0]?.node?.availableForSale ?? true,
  };
}
```
