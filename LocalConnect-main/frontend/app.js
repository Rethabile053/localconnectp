fetch("http://localhost:3000/products")
.then(res => res.json())
.then(data => {
    const container = document.getElementById("products");

    data.forEach(product => {
        const div = document.createElement("div");
        div.innerHTML = `
            <h3>${product.name}</h3>
            <p>${product.price}</p>
            <button onclick="addToCart(${product.id})">Add to Cart</button>
        `;
        container.appendChild(div);
    });
});

function addToCart(id) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push(id);
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("Added to cart");
}