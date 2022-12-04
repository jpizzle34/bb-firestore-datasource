import { IntegrationBase } from "@budibase/types";

import { Firestore, WhereFilterOp } from "@google-cloud/firestore";

interface FirebaseConfig {
	email: string;
	privateKey: string;
	projectId: string;
}

class CustomIntegration implements IntegrationBase {
	private config: FirebaseConfig;
	private client: Firestore;

	constructor(config: FirebaseConfig) {
		this.config = config;
		this.client = new Firestore({
			projectId: this.config.projectId,
			credentials: {
				client_email: this.config.email,
				private_key: this.config.privateKey?.replace(/\\n/g, "\n"),
			},
		});
	}

	async create(query: { json: object; extra: { [key: string]: string } }) {
		try {
			const documentReference = this.client
				.collection(query.extra.collection)
				.doc();
			await documentReference.set({
				...query.json,
				id: documentReference.id,
			});
			const snapshot = await documentReference.get();
			return snapshot.data();
		} catch (err) {
			console.error("Error writing to Firestore", err);
			throw err;
		}
	}

	async read(query: { json: object; extra: { [key: string]: string } }) {
		try {
			let snapshot;
			const collectionRef = this.client.collection(
				query.extra.collection
			);
			if (
				query.extra.filterField &&
				query.extra.filter &&
				query.extra.filterValue
			) {
				snapshot = await collectionRef
					.where(
						query.extra.filterField,
						query.extra.filter as WhereFilterOp,
						query.extra.filterValue
					)
					.get();
			} else {
				snapshot = await collectionRef.get();
			}
			const result: any[] = [];
			snapshot.forEach((doc) => result.push(doc.data()));

			return result;
		} catch (err) {
			console.error("Error querying Firestore", err);
			throw err;
		}
	}

	async update(query: {
		json: Record<string, any>;
		extra: { [key: string]: string };
	}) {
		try {
			await this.client
				.collection(query.extra.collection)
				.doc(query.json.id)
				.update(query.json);

			return (
				await this.client
					.collection(query.extra.collection)
					.doc(query.json.id)
					.get()
			).data();
		} catch (err) {
			console.error("Error writing to Firestore", err);
			throw err;
		}
	}

	async delete(query: {
		json: { id: string };
		extra: { [key: string]: string };
	}) {
		try {
			await this.client
				.collection(query.extra.collection)
				.doc(query.json.id)
				.delete();
			return true;
		} catch (err) {
			console.error("Error deleting from Firestore", err);
			throw err;
		}
	}
}

export default CustomIntegration;
