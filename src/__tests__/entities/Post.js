import Entity from '../../Entity';

export default class Post extends Entity {
  static get schema() {
    return {
      title: {
        type: String,
        null: false,
        default: "Untitled"
      },
      content: String,
      active: {
        type: Boolean,
        default: true
      },
      creation_date: Date,
      update_date: Date
    }
  }
}
