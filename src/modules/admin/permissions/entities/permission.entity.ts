import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "../../roles/entities/role.entity";

@Entity()
export class Permission {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({nullable: true})
    label!: string;

    @Column()
    action?: string;

    @Column()
    subject?: string;    

    @ManyToMany(() => Role, (role) => role.permissions)
    roles?: Role[];
}
