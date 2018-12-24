import mongoose from 'mongoose';
import Post from './entities/Post.js';
import DB from '../DB';

const DB_NAME = "MongoDB";

describe('Entity', () => {

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

  it(`should save an instance of Entity with ${DB_NAME} as a database`, async () => {

    const post = new Post({
      title: "A post",
      content: "Lorem ipsum dolor sit amet",
      creation_date: (new Date()).toISOString(),
      update_date: new Date().toISOString()
    });

    await post.save();

    expect(post).toHaveProperty("_id");
    expect(post).toHaveProperty("title", "A post");
    expect(post).toHaveProperty("content", "Lorem ipsum dolor sit amet");
    expect(post).toHaveProperty("creation_date");
    expect(post).toHaveProperty("update_date");

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
