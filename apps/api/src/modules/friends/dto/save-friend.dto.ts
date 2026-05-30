import { z } from "zod";
import { saveFriendSchema } from "../schemas/friends.schemas";

export type SaveFriendDto = z.infer<typeof saveFriendSchema>;
