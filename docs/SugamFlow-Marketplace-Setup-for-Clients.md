# SugamFlow marketplace setup

How to connect a shop to Amazon India and Flipkart, and how each selling SKU becomes a SugamFlow product.

SugamFlow does not log in with the seller’s marketplace password. It stores the application credentials the marketplace issues, then pulls orders into the shop as unpaid sales bills.

## What you get

| Channel | What SugamFlow pulls | What it creates |
|---|---|---|
| Amazon India | One page of unshipped orders | One unpaid sales bill per order |
| Flipkart | One page of approved shipments | One unpaid sales bill per shipment |

A bill is created only when three things are true:

1. **Order sync** is ticked on that channel.
2. **Default customer id** is a customer that already exists in this shop.
3. Each marketplace SKU is mapped to a product that already exists in SugamFlow.

SugamFlow does not create the product, the customer, or a paid invoice from the marketplace. Stock is not pushed back to Amazon or Flipkart.

Shopify, Meesho, Website, and Other appear in the channel list. This guide covers the two channels that pull orders today: Amazon and Flipkart.

## Before you start

Prepare these in the shop, before opening Amazon or Flipkart:

1. Sign in to SugamFlow as the shop owner.
2. Confirm **Settings → Integrations** opens. If the page says the marketplace module is off, ask SugamFlow to turn the module on for this shop. Do not continue until the sales-channel form is visible.
3. Create every product you sell online. Use **Products**. The marketplace screen cannot create a product.
4. Note the **product id** of each item. You will map the marketplace SKU to that id.
5. Create one customer who will own marketplace bills, for example “Amazon sales” or “Flipkart sales”. Open that customer and note the numeric **customer id**. The shop code, such as `ART-01`, is not a customer id.
6. Keep the seller email and password for Seller Central or Flipkart Seller Hub. Type them only on those websites. Never type them into SugamFlow.

## Where to work in SugamFlow

Open **Settings → Integrations**.

The screen has three parts you will use:

- **Add channel** — choose AMAZON or FLIPKART, then **Add**.
- **Channel form** — seller, marketplace, customer, and the Order sync tick.
- **SKU mapping** — link each marketplace SKU to a SugamFlow product.

**Connect** only marks the channel ready. For Amazon it does not call Amazon. Use **Authorize with Amazon** or the refresh token from Amazon, and **Connect Flipkart** for Flipkart.

**Save channel** stores the form. A blank credential box keeps the value already saved. Saved secrets are not shown again.

## Fields used by every channel

| Field | What to enter |
|---|---|
| Seller id | Optional label for this seller account. Leave blank if you do not have one yet. |
| Marketplace id | Amazon India: `A21TJRUUN4KGV`. Leave blank for Flipkart unless Flipkart gave you one. |
| Region | Amazon India: `eu-west-1`. |
| Warehouse id | Optional. Leave blank unless SugamFlow has given you a warehouse id. |
| Default customer id | The numeric customer id from step 5 above. Required. |
| Order prefix / Invoice prefix | Optional. Leave blank to keep the shop’s normal numbering. |
| Stock buffer qty | `0` unless you want to hold some units back from the quoted sellable quantity. |
| Sync interval | **Manual**. Orders come in when you click **Pull orders**. |
| Order sync | Tick this. This is the switch that creates bills. |
| Other ticks | Leave them off. Inventory, price, stock, customer, webhook, auto invoice, auto reserve, auto confirm, auto print, and notification are not used by the Amazon or Flipkart pull. |

Click **Save channel** after these values are filled.

## Map every product

Do this for Amazon and again for Flipkart. A mapping belongs to one channel.

1. On the channel, scroll to **SKU mapping**.
2. **Channel SKU**: type the SKU exactly as it appears on Amazon or Flipkart. Example: `CAR COMBO SET 3 WHB`.
3. **Listing id**: leave blank. SugamFlow uses the SKU.
4. Click **Match exact SKU**. If one product matches, its id fills in.
5. If several products match, or none match, click **Search**, then click the correct product button. You can also type the product id yourself.
6. Click **Save mapping**.
7. The table must show the channel SKU, the listing, and the product id. **Sellable** may show a dash until stock is loaded. That does not block the order pull.
8. Repeat for every SKU you sell on that marketplace.

An order line whose SKU is not in this table does not create a product and does not become a bill line.

## Amazon India

Amazon needs two sets of values.

| Who keeps it | Value |
|---|---|
| SugamFlow server, once per app | Application id, Login with Amazon client id, Login with Amazon client secret, AWS access key, AWS secret key |
| This shop’s channel | Refresh token from the seller authorization |

The **Client id** and **Client secret** boxes on the Amazon channel are not what Amazon reads. Put the refresh token in **Refresh token**, then **Save channel**.

### 1. Seller account

1. Open [Seller Central India](https://sellercentral.amazon.in/).
2. Sign in with the seller email and password.
3. Confirm you are in the India account that owns the listings. If several accounts are listed, pick the India seller, not an Amazon.com (United States) account.

### 2. Developer app

1. Open the Solution Provider Portal for the same seller.
2. Choose **Build applications that use SP APIs**.
3. Register the developer profile and wait until Amazon marks it approved.
4. Create an app:
   - App name: your company name, for example SugamFlow
   - API type: **SP API**
   - App type: **Production**
   - Business entity: **Sellers**
5. On the app roles, include **Inventory** and **Orders**.
6. For the personal-data question, answer that you will not delegate access to personal data to another developer’s application.
7. Save the app. Copy the application id. It starts with `amzn1.sp.solution.`.

### 3. Login with Amazon credentials

1. On the app, open **LWA credentials → View**.
2. Copy the **Client identifier**. It starts with `amzn1.application-oa2-client.`.
3. Click inside **Client secret**, select all, and copy the full secret. It starts with `amzn1.oa2-cs.v1.` and is longer than the box, so a partial copy will be rejected.
4. Do not click **Rotate secret** after this copy. Rotation invalidates the secret already stored.
5. Send the application id, client identifier, and full client secret to SugamFlow through a private channel. Do not put them in email that other people can forward, and do not paste them into the Amazon channel form.

SugamFlow installs those three values on the server. They are shared by the app. Each shop still has its own refresh token.

### 4. Authorize this seller

A private app does not use the public redirect. Generate the token inside Amazon:

1. In Developer Central, open the app.
2. Open the arrow next to **Edit App**, then **Authorize** or **Manage Authorizations**.
3. Choose the India seller account.
4. Click **Authorize app**.
5. Copy the refresh token. It is a long value and usually starts with `Atzr|`.
6. In SugamFlow, on the AMAZON channel, paste it into **Refresh token** and click **Save channel**.
7. The channel should show **CONNECTED** and **Credentials saved**, and **Pull orders** should appear.

### 5. AWS key for Amazon calls

Amazon also requires an AWS user that is allowed to call Selling Partner API.

1. In the AWS account that belongs to this seller or this developer, create an IAM user, for example `sugamflow-spapi`.
2. Leave console access off.
3. Create one access key.
4. Add an inline policy that allows only `execute-api:Invoke`.
5. Send the access key id and secret access key to SugamFlow the same private way as the client secret. Do not send the key for any other AWS user, such as a database user.

SugamFlow stores the key on the server. **Permissions policies** on that user must show the policy. A key with no policy can sign in to AWS and still be rejected by Amazon.

### 6. Amazon channel values

| Field | Value |
|---|---|
| Marketplace id | `A21TJRUUN4KGV` |
| Region | `eu-west-1` |
| Default customer id | The numeric customer id from this shop |
| Sync interval | Manual |
| Order sync | Ticked |
| Refresh token | The token from **Authorize app** |

The footer id on Seller Central (CID) is not the marketplace id. Do not paste it into **Marketplace id**.

### 7. Pull Amazon orders

1. Map the SKUs, as described above.
2. Click **Pull orders**.
3. If Amazon has no unshipped orders, success looks like **Pulled 0. 0 saved.**
4. If Amazon has unshipped orders and the SKUs are mapped, each order becomes an unpaid bill for the default customer.

Pull reads unshipped orders only, and only one page. Click **Pull orders** again later for new orders. It does not import shipped, cancelled, or already saved orders as new bills.

## Flipkart

Flipkart credentials are saved on the channel. There is no separate server application id for Flipkart.

### 1. Flipkart application

1. Sign in to Flipkart Seller Hub with the seller account.
2. Open the developer or API section and create, or open, the seller application.
3. Copy the application id and the application secret.
4. Do not copy the Seller Hub password into SugamFlow.

### 2. Flipkart channel values

1. In **Settings → Integrations**, add **FLIPKART**.
2. Set **Default customer id** to a numeric customer in this shop. It can be a different customer from the Amazon one.
3. Set **Sync interval** to Manual.
4. Tick **Order sync** only.
5. Paste the Flipkart application id into **Client id**.
6. Paste the Flipkart application secret into **Client secret**.
7. Click **Save channel**. The boxes then show **Saved**.
8. Click **Connect Flipkart**. SugamFlow exchanges those two values for a token. The status becomes **CONNECTED**.
9. Map every Flipkart SKU to an existing product, the same way as Amazon.
10. Click **Pull orders**.

Pull reads approved shipments, up to one page. A successful pull with nothing waiting is a pulled count of 0. A mapped shipment becomes an unpaid bill for the default customer.

## After the first pull

- Open **Sale** and find the unpaid bill. The customer is the default customer you entered.
- Lines appear only for mapped SKUs.
- **Marketplace orders** on the same Integrations page lists what this channel has stored. Use **Refresh** there.
- Record a marketplace payout under **Bank settlement** only when you want a note of the payout and fees. That record does not mark the customer bill paid. Take payment on the bill in the normal way.
- Status mapping on the same page does not import orders. Leave it until you need to translate a marketplace status name.

## Checklist to send to SugamFlow

Send this list. Leave the secret cells empty in any shared copy, and send the secret values separately.

| Item | Amazon | Flipkart |
|---|---|---|
| Shop name and outlet code | | |
| Marketplace module visible on Integrations | Yes / No | Yes / No |
| Default customer id | | |
| Application id | | Application id in Client id |
| Client id | Login with Amazon client id | Same as application id |
| Client secret | Full Login with Amazon secret | Application secret |
| Refresh token | From Authorize app | Filled by Connect Flipkart |
| AWS access key id | | Not used |
| AWS secret access key | | Not used |
| IAM policy `execute-api:Invoke` attached | Yes / No | Not used |
| Marketplace id | `A21TJRUUN4KGV` | |
| Region | `eu-west-1` | |
| SKU mappings saved | List of SKU → product id | List of SKU → product id |
| Order sync ticked | Yes | Yes |

## Do not do this

- Do not type the Seller Central or Seller Hub password into SugamFlow.
- Do not click **Rotate secret** after the client secret has been copied.
- Do not put the shop code in **Default customer id**.
- Do not put the Amazon CID in **Marketplace id**.
- Do not expect a new product to appear because an order arrived. Create the product first, then map the SKU.
- Do not tick every sync box. **Order sync** is the one that creates bills.
