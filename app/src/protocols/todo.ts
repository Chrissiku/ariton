export const protocolDefinition = {
  protocol: 'https://didcomm.org/shared-todo',
  published: true,
  types: {
    list: {
      schema: 'https://didcomm.org/shared-todo/schemas/list.json',
      dataFormats: ['application/json'],
    },
    todo: {
      schema: 'https://didcomm.org/shared-todo/schemas/todo.json',
      dataFormats: ['application/json'],
    },
  },
  structure: {
    list: {
      $actions: [
        {
          who: 'anyone',
          can: ['create', 'update', 'read'],
        },
      ],
      todo: {
        $actions: [
          {
            who: 'author',
            of: 'list',
            can: ['create', 'update'],
          },
          {
            who: 'recipient',
            of: 'list',
            can: ['create', 'update'],
          },
        ],
      },
    },
  },
};
