# Patient timeline components

This repository contains a standalone version of patient timeline visualisation components originally embedded in Microsoft Dynamics 365.
The project is a Proof of Concept implementation in the context of the [UNA project](https://www.kuntaliitto.fi/asiantuntijapalvelut/una-asiakas-ja-potilastietojarjestelmien-uudistamisyhteistyo).
The components obtain their patient data from Atostek eRA.

## Using the components

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

The project can be hosted in any environment that can serve static JavaScript and HTML files. In this example, the project is hosted on a Node.js Express server. To run the project with Node.js, follow the instructions for installation of Node and npm at https://docs.npmjs.com/getting-started/installing-node

Run the project on a recent version of either Mozilla Firefox or Google Chrome. Internet Explorer is not currently supported.

### Installation and deployment

Once the prerequisites are installed, clone the repository to your machine with the following git command:
```
git clone https://github.com/Atostek/patient-timelines.git
```
Alternatively, you can download the project as a zip file and extract it. Then, at the root of the project, run command:

```
npm install
```

Finally, do:

```
npm start
```

By default, the server will then be running at http://localhost:3000. For the purpose of testing the product comes with a set of static test data which can be accessed by pressing the "Testikäyttö kirjautumatta" button. Full utilization requires
authentication with Atostek eRA.

### Using a single component separately

For the purpose of demonstration, the components are embedded into a single index.html in this project. However, each component can be used separately if either the data or a copy of eRADataLibrary.js and the session variables are provided.

eRA_data_form, eRA_timeline_form and eRA_multiailment_form have the following API:
* function run(data, sessionId, contextId) where either the data or sessionId and contextId need to be provided
* postMessage with data
* postMessage with an object containing event "patient_open", the sessionId and the contextId

## License

The source code is subject to the terms of the GNU General Public License v3.0.

### Third party library licenses

* [Bootstrap - MIT](https://github.com/twbs/bootstrap/blob/master/LICENSE)
* [JQuery - MIT](https://github.com/jquery/jquery/blob/master/LICENSE.txt)
* [mark.js - MIT](https://github.com/julmot/mark.js/blob/master/LICENSE)
* [ScrollLock - GPL v3.0](https://github.com/MohammadYounes/jquery-scrollLock/blob/master/LICENSE)
* [StickyTableHeaders - MIT](https://github.com/jmosbech/StickyTableHeaders/blob/master/license.txt)
* [TimelineJS3 - MPL v2.0](https://github.com/NUKnightLab/TimelineJS3/blob/master/LICENSE)

## Limitations

This product is a PoC and is not to be used in production as is.
