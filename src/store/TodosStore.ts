import { writable } from 'svelte/store'

export default class TodosStore {
	private todos = writable([
		{
			id: 1616150160176,
			title: 'Number one',
			text: 'Adasdasdadadasdadadad'
		},
		{
			id: 1616150176804,
			title: 'Number two',
			text: 'Adasdasdadadasdadadad'
		},
		{
			id: 1616150190615,
			title: 'Number three',
			text: 'Adasdasdadadasdadadad'
		}
	]);

	get todosList() {
		return this.todos;
	}

	addTodo(newTodo: TTodo) {
		this.todos.update((value) => {
			value.push(newTodo);
			return value
		});
	}

	removeTodo(todoId: number) {
		this.todos.update((value) => value.filter(({ id }) => id !== todoId))
	}
}

export type TTodo = {
	id: number;
	title: string;
	text: string;
};
