<script lang="ts">
import TodoListItem from './TodoListItem.svelte';
import TodoListItemCreate from './TodoListItemCreate.svelte';

let list = [
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
	},
];

function addTodo(event: CustomEvent) {
	const newTodo = event.detail;
	list = [
		...list,
		newTodo
	];
}

function removeItem(event: CustomEvent) {
	const itemId = event.detail;
	list = [...list].filter(({ id }) => id !== itemId);
}

</script>

<template>
<div class="row">
	<div class="column">
		<h2>Todos</h2>
		{#if list.length}
			{#each list as listItem}
				<TodoListItem 
					listItem="{listItem}"
					on:remove="{removeItem}"
				></TodoListItem>
			{/each}
		{:else}
			<p class="message-empty">Empty</p>
		{/if}
	</div>
	<div class="column">
		<TodoListItemCreate on:addTodo="{addTodo}"></TodoListItemCreate>
	</div>
</div>


</template>

<style>
.row {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
}

.column {
  flex: 50%;
  margin: 0 20px;
}

.message-empty {
	color: gray;
}
</style>

