import Customer from "../entities/Customer";
import Address from "../entities/Address";
import CartService from "./CartService";

const CustomerService = {
    customerApi: new Customer({}, false),
    ANONYMOUS_ID: 1,
    DEFAULT_COUNTRY_ID: 8,

    /**
     * Associe un client existant à un panier (connexion client -> panier).
     *
     * Paramètres:
     * - `cart` (Cart): panier à mettre à jour.
     * - `customer` (Customer|object): client existant ou objet partiel contenant `id`.
     *
     * Retour: Promise<{cart: Cart, customer: Customer, address: Address}> — panier et client mis à jour.
     *
     * Règles métier:
     * - Vérifie que le panier existe (`cart.id`).
     * - Recharge le client via l'API si `customer.id` est fourni.
     * - Récupère la première adresse disponible; si aucune, l'opération échoue.
     * - Délègue la mise à jour à `CartService.updateCartForCustomer`.
     *
     * Exemple:
     * await CustomerService.connectCustomerToCart(cart, { id: 5 })
     */
    async connectCustomerToCart(cart, customer) {
        if (!cart?.id) {
            throw new Error("Cart not found");
        }

        const customerApi = new Customer({}, false);
        const freshCustomer = customer?.id ? await customerApi.getById(customer.id) : customer;
        const addresses = await freshCustomer.getAddress();

        if (!addresses?.length) {
            throw new Error("Aucune adresse pour ce client");
        }

        const updated = await CartService.updateCartForCustomer(cart, freshCustomer, addresses[0]);
        return { cart: updated, customer: freshCustomer, address: addresses[0] };
    },

    /**
     * Crée un client (et son adresse) puis l'associe au panier fourni.
     *
     * Paramètres:
     * - `cart` (Cart): panier à rattacher.
     * - `form` (object): champs attendus { firstname, lastname, email, password, address1, postcode, city }.
     * - `options` (object): options facultatives (ex: countryId).
     *
     * Retour: Promise<{cart: Cart, customer: Customer, address: Address}> — objets créés et panier mis à jour.
     *
     * Règles métier:
     * - Vérifie que le panier existe.
     * - Crée le client avec `isGuest=0` et valeurs par défaut PrestaShop.
     * - Crée une adresse liée au client et l'utilise pour mettre à jour le panier.
     *
     * Exemple:
     * await CustomerService.registerCustomerForCart(cart, { firstname: 'A', lastname: 'B', email: 'a@b.c', password: 'pwd', address1: 'Rue', postcode: '75000', city: 'Paris' })
     */
    async registerCustomerForCart(cart, form, options = {}) {
        if (!cart?.id) {
            throw new Error("Cart not found");
        }

        const {
            firstname,
            lastname,
            email,
            password,
            address1,
            postcode,
            city,
        } = form || {};

        const newCustomer = Customer.fromData({
            firstname,
            lastname,
            email,
            password,
            active: 1,
            isGuest: 0,
            idLang: 1,
            idShop: 1,
            idShopGroup: 1,
            idDefaultGroup: 3,
        });
        const createdCustomer = await newCustomer.save();

        const countryId = Number(options?.countryId || CustomerService.DEFAULT_COUNTRY_ID);
        const newAddress = Address.fromData({
            idCustomer: createdCustomer.id,
            idCountry: countryId,
            idState: 0,
            alias: "Checkout",
            firstname,
            lastname,
            address1,
            postcode,
            city,
        });
        const createdAddress = await newAddress.save();

        const updated = await CartService.updateCartForCustomer(cart, createdCustomer, createdAddress);
        return { cart: updated, customer: createdCustomer, address: createdAddress };
    },
};

export default CustomerService;