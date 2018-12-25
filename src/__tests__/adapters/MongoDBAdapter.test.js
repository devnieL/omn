import mongoose from 'mongoose';
import MongoDBAdapter from '../../adapters/mongodb/MongoDBAdapter';
import DB from '../../DB';
import Entity from '../../Entity';

const DB_NAME = "MongoDB";

describe("MongoDBAdapter", () => {

  const setDB = async () => {
    await DB.configure({
      db: {
        type: "mongodb",
        client: await mongoose.connect("mongodb://localhost:27017/omn", {
          autoReconnect: true,
          socketTimeoutMS: 300000,
          connectTimeoutMS: 300000,
          keepAlive: true,
          reconnectTries: 30,
          reconnectInterval: 3000,
        })
      }
    });
  }

  const unsetDB = async () => {
    DB.configure({
      db: null
    });
  }

  beforeAll(async () => {

   await setDB();

  });

  describe("#create()", async () => {

    it(`should create an adapter for the provider class`, async () => {

      class Post extends Entity {}

      const adapter = MongoDBAdapter.create(Post);

      expect(adapter).not.toBeNull();
      expect(adapter.instanceClass).toEqual(Post);
      expect(adapter.originalSchema).toEqual(Post.schema);
      expect(adapter.model).not.toBeNull();

    });

    it(`should return an error if the DB hasn't been configured`,  async () => {

      unsetDB();

      class Post extends Entity {}
      expect(() => {
        MongoDBAdapter.create(Post)
      }).toThrowError("To get or create a model, a db needs to be configured.");

    });

  });

  describe("#createSchema()", async () => {

    it(`should create a mongoose schema based on the provided class inherited from Entity`, async () => {

      await setDB();

      const collection_name = 'Post';
      class Post extends Entity {}
      const schema = MongoDBAdapter.createSchema(Post, collection_name);
      expect(schema).toBeInstanceOf(mongoose.Schema);
      expect(schema.options.collection).toBe(collection_name);

    });

    it(`should return error if the provided Entity class have an 'schema' property that is not an object`, async () => {

      await setDB();

      const collection_name = 'Post';
      class Post1 extends Entity {
        static schema = 'test';
      }

      expect(() => {
        const schema = MongoDBAdapter.createSchema(Post1, collection_name);
      }).toThrowError('The schema property value of the entity class should be an object');

      class Post2 extends Entity {
        static schema = 1;
      }

      expect(() => {
        const schema = MongoDBAdapter.createSchema(Post2, collection_name);
      }).toThrowError('The schema property value of the entity class should be an object');

      class Post3 extends Entity {
        static schema = () => {};
      }

      expect(() => {
        const schema = MongoDBAdapter.createSchema(Post3, collection_name);
      }).toThrowError('The schema property value of the entity class should be an object');

    });

    it(`should return error if there is no collection name provided`, async () => {
      expect(() => {
        class Post extends Entity {}
        const schema = MongoDBAdapter.createSchema(Post);
      }).toThrowError('A collection name is required');
    });

    it(`should return error if there is no Entity class provided`, async () => {
      expect(() => {
        const schema = MongoDBAdapter.createSchema();
      }).toThrowError('A class inherited from Entity is required.');
    });

    it(`should create a mongoose schema that complies with the provided schema types`, async () => {

      class Author extends Entity {
        static schema = {
          name: String
        }
      }

      class Comment extends Entity {
        static schema = {
          content: String
        }
      }

      const schema = {
        title: String,
        date: Date,
        views: Number,
        author: Author,
        metadata: Object,
        tags: [String],
        comments: [Comment],
        updates: [Date],
        versions: [Number],
        annotations: [Object]
      }

      class Post extends Entity {
        static schema = schema;
      }

      const mongooseSchema = MongoDBAdapter.createSchema(Post, Post.name);

      console.log('Schema:', mongooseSchema);
      console.log('Schema:', mongooseSchema.title);

      // mongoose converts the type to its string representation.
      expect(schema.title.name).toBe(mongooseSchema.obj.title.type);
      expect(schema.date.name).toBe(mongooseSchema.obj.date.type);
      expect(schema.views.name).toBe(mongooseSchema.obj.views.type);
      expect(schema.metadata.name).toBe(mongooseSchema.obj.metadata.type);
      expect(schema.tags[0].name).toBe(mongooseSchema.obj.tags[0].type);
      expect(schema.updates[0].name).toBe(mongooseSchema.obj.updates[0].type);
      expect(schema.versions[0].name).toBe(mongooseSchema.obj.versions[0].type);
      expect(schema.annotations[0].name).toBe(mongooseSchema.obj.annotations[0].type);

      // different treatment for properties that refers to classes
      expect(mongooseSchema.obj.author.type.name).toBe('ObjectId');
      expect(mongooseSchema.obj.comments[0].type.name).toBe('ObjectId');

      expect(schema.author.name).toBe(mongooseSchema.obj.author.ref);
      expect(schema.comments[0].name).toBe(mongooseSchema.obj.comments[0].ref);

    });

  });

});
