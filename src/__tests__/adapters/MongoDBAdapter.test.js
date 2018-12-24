import mongoose from 'mongoose';
import MongoDBAdapter from '../../adapters/mongodb/MongoDBAdapter';
import Post from '../entities/Post.js';
import DB from '../../DB';

const DB_NAME = "MongoDB";

describe("MongoDBAdapter", () => {

  beforeAll(async () => {

    DB.configure({
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

  });

  it(`should create an adapter for the provider class`, async () => {

    const adapter = MongoDBAdapter.create(Post);
    console.log('adapter:', adapter);

    expect(adapter).not.toBeNull();
    expect(adapter.instanceClass).toEqual(Post);
    expect(adapter.originalSchema).toEqual(Post.schema);
    expect(adapter.model).not.toBeNull();

  });

  it(`should read an instance of the Entity inherited class with ${DB_NAME} as a database`, async () => {

    const post = new Post({
      title: "A post",
      content: "Lorem ipsum dolor sit amet",
      creation_date: (new Date()).toISOString(),
      update_date: new Date().toISOString()
    });

    await post.save();

    const postRead = await Post.read(post.id);

    expect(postRead).toHaveProperty("_id", post.id);
    expect(postRead).toHaveProperty("title", post.title);
    expect(postRead).toHaveProperty("content", post.content);
    expect(postRead).toHaveProperty("creation_date", post.creation_date);
    expect(postRead).toHaveProperty("update_date", post.update_date);

  });

  it(`should delete an instance of the Entity inherited class with ${DB_NAME} as a database`, async () => {

    const post = new Post({
      title: "A post",
      content: "Lorem ipsum dolor sit amet",
      creation_date: (new Date()).toISOString(),
      update_date: new Date().toISOString()
    });

    await post.save();
    expect(post).toHaveProperty("_id", post.id);

    await Post.delete(post.id);
    let postRead = await Post.read(post.id);
    expect(postRead).toBeNull();

  });

  it(`should return a list of instances that fulfill a query to the Entity inherited class with ${DB_NAME} as a database`, async () => {

  });

});
