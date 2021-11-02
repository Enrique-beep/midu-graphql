import { gql, ApolloServer, UserInputError } from 'apollo-server';
import axios from 'axios';

const typeDefs = gql`
  enum YesNo {
    YES
    NO
  }

  type Company { 
    name: String 
    catchPhrase: String 
    bs: String 
  }

  type Address { 
    street: String
    suite: String
    city: String
    zipcode: String
  }

  type Person { 
    id: Int
    name: String
    username: String
    email: String
    phone: String
    website: String
    company: Company
    address: Address 
  }

  input InputCompany {
    name: String 
    catchPhrase: String 
    bs: String
  }

  input InputAddress {
    street: String
    suite: String
    city: String
    zipcode: String
  }

  input InputPerson {
    name: String!
    username: String!
    email: String!
    phone: String
    website: String
    company: InputCompany
    address: InputAddress
  }

  input InputNewPhone {
    username: String!
    newPhone: String!
  }

  type Query {
    personCount: Int!
    allPersons(phone: YesNo): [Person]!
    findPerson(name: String!): Person
  }

  type Mutation {
    addPerson(person: InputPerson!): Person
    editPhoneNumber(data: InputNewPhone!): Person
  }
`;

const apiRestHandler = async ({ method, payload }) => {
  switch (method.toLocaleUpperCase()) {
    case 'GET': 
      return await axios.get('http://localhost:3000/persons');
    case 'POST':
      return await axios.post('http://localhost:3000/persons', payload);
    case 'PUT':
      return await axios.put(`http://localhost:3000/persons/${payload.id}`, payload);
    default: 
      throw Error('There is no a valid method');
  }
};

const resolvers = {
  Query: {
    personCount: async () => {
      const { data: personsFromRestApi } = await apiRestHandler({ method: 'GET' });
      return personsFromRestApi.length;
    },
    allPersons: async (root, args) => {
      const { data: personsFromRestApi } = await apiRestHandler({ method: 'GET' });
      if (!args.phone) return personsFromRestApi;

      const byPhone = person => 
        args.phone === "YES" ? person.phone : !person.phone;

      return personsFromRestApi.filter(byPhone);
    },
    findPerson: async (root, args) => {
      const { data: personsFromRestApi } = await apiRestHandler({ method: 'GET' });
      const { name } = args;
      return personsFromRestApi.find(person => person.name === name);
    },
  },
  Mutation: {
    addPerson: async (root, { person }) => {
      const { data: personsFromRestApi } = await apiRestHandler({ method: 'GET' });

      if (personsFromRestApi.find(p => p.name === person.name)) {
        throw new UserInputError('Name must be unique', {
          "invalidArgs": person.name,
        });
      }

      const { data: newPerson } = await apiRestHandler({ method: 'POST', payload: person });

      return newPerson;
    },
    editPhoneNumber: async (root, { data }) => {
      const { data: personsFromRestApi } = await apiRestHandler({ method: 'GET' });

      const personIndex = personsFromRestApi.findIndex(p => p.username === data.username);
      if (personIndex === -1) return null;

      const person = personsFromRestApi[personIndex];
      const updatedPerson = { ...person, phone: data.newPhone };
      
      const { data: newPerson } = await apiRestHandler({ method: 'PUT', payload: updatedPerson });

      return newPerson;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  cors: true,
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${ url }`);
});
