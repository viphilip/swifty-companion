# Mobile Initiation: Swifty Companion

**Summary:** This project aims to introduce you to the development of mobile applications.

## Introduction

In this project you will discover how to develop a mobile application. 
The aim of the project is to build an application that will retrieve the information of 42 students, using the 42 API. An API (Application programming interface) is a set of routines, protocols, and tools for building software applications. APIs often come in the form of a library that includes specifications for routines, data structures, object classes, and variables. In other cases, notably SOAP and REST services, an API is simply a specification of remote calls exposed to the API consumers.

## General instructions

- This project will be evaluated only by humans.
- You can use any mobile language. Keep in mind that you must use the latest version of the IDE available on your school computers.
- You can use any compatible frameworks and libraries as long as their use is justified during your defense. Be smart!
- This project must use the latest available version of the 42 API.
- Remember that your choice can make you more attractive on the job market.

> **⚠️ Warning:** For obvious security reasons, any credentials, API keys, env variables etc. must be saved locally in a `.env` file and ignored by git. Publicly stored credentials will lead you directly to a failure of the project.

## The project

### V.1 Mandatory part

To validate the mandatory part of the project, you need to meet the following criteria:

- Your app must have at least 2 views.
- You must handle all cases of errors (login not found, network error, etc.).
- The second view must display the login information, if the login exists.
- You must display at least four details for the user (login, email, mobile, level, location, wallet, evaluations etc.) along with the profile picture.
- You must display the user’s skills with level and percentage.
- You must display the projects that the user has completed, including failed ones.
- Your app must allow for navigating back to the first view.
- This project must use a flexible or modern layout technique, such as layout constraints, to ensure that the user interface displays correctly on different screen sizes and mobile platforms.
- Do not create a token for each query. Refer to the OAuth2 documentation.

> **ℹ️ Note:** You must use intra oauth2. Due to data privacy concerns, and in compliance with relevant laws in certain countries, it may be necessary to refrain from disclosing certain information.

## Bonus

Bonus available:

- Recreate token at expiration date. If the token expires, the application must refresh it. The application must still be able to work properly in any case.

> **⚠️ Important:** The bonus part will only be assessed if the mandatory part is **PERFECT**. Perfect means that the mandatory part has been completed entirely and works without any malfunctions. If you have not fulfilled ALL of the mandatory requirements, your bonus part will not be evaluated.

## Resources

- **42 API Documentation:** [https://api.intra.42.fr/apidoc](https://api.intra.42.fr/apidoc) (Use this reference to understand endpoints, OAuth2 authentication, and data structures for the project).
